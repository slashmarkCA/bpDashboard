/* ============================================================================
   bp_data_normalized.js
   ---------------------------------------------------------------------------
   One-time normalization layer with robust validation
   - Multi-format date parsing with detailed error reporting
   - Data type validation and sanitization
   - BP category calculation via bp_utils.js
   - Outlier detection for medical readings
   ============================================================================ */

import { getBPCategory, getPulseCategory, getPulsePressureCategory } from './bp_utils.js';

const RAW_BP_DATA =
    window.ALL_BP_DATA ||
    window.BP_DATA ||
    window.sourceData ||
    window.bpData ||
    null;

/**
 * Robust Date Parser
 * Handles format: "YYYY-MM-DD HH:MM:SS AM/PM" (your actual data format)
 * @param {string} dateStr - Date string to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
function parseBPDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        console.error('[DATE PARSER] Invalid input:', dateStr);
        return null;
    }

    const parts = dateStr.split(' ');
    if (parts.length < 3) {
        console.error('[DATE PARSER] Insufficient date parts:', dateStr);
        return null;
    }

    const [datePart, timePart, ampm] = parts;
    
    // Handle YYYY-MM-DD format
    const [year, month, day] = datePart.split('-');
    
    if (!year || !month || !day) {
        console.error('[DATE PARSER] Invalid date part:', datePart);
        return null;
    }
    
    let [hours, minutes, seconds] = timePart.split(':');
    
    if (!hours || !minutes || !seconds) {
        console.error('[DATE PARSER] Invalid time part:', timePart);
        return null;
    }
    
    let h = parseInt(hours, 10);
    if (ampm && ampm.toLowerCase() === 'pm' && h < 12) h += 12;
    if (ampm && ampm.toLowerCase() === 'am' && h === 12) h = 0;

    // Construct ISO string for Date constructor
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${String(h).padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    const d = new Date(iso);
    
    if (isNaN(d.getTime())) {
        console.error('[DATE PARSER] Invalid date created:', iso);
        return null;
    }
    
    return d;
}

/**
 * Validates and sanitizes a numeric medical reading
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error reporting
 * @param {number} min - Minimum acceptable value
 * @param {number} max - Maximum acceptable value
 * @returns {number|null} Validated number or null
 */
function validateNumericReading(value, fieldName, min, max) {
    const num = Number(value);
    
    if (isNaN(num)) {
        console.error(`[VALIDATOR] ${fieldName} is not a number:`, value);
        return null;
    }
    
    if (num < min || num > max) {
        console.warn(`[VALIDATOR] ${fieldName} out of range (${min}-${max}):`, num);
        // Return null for clearly invalid data, but allow processing to continue
        if (num < 0 || num > max * 2) return null;
    }
    
    return num;
}

/**
 * Main normalization function
 * Processes raw BP data with comprehensive validation
 * @returns {Array} Normalized and validated BP records
 */
export function normalizeData() {
    if (!Array.isArray(RAW_BP_DATA)) {
        console.error('[NORMALIZER] No raw BP data array found on window');
        if (typeof showGlobalErrorBanner === 'function') {
            showGlobalErrorBanner('Critical: Blood pressure data not loaded');
        }
        return [];
    }

    if (RAW_BP_DATA.length === 0) {
        console.warn('[NORMALIZER] Raw data array is empty');
        return [];
    }

    const parseErrors = [];
    const validationErrors = [];
    
    const normalized = RAW_BP_DATA.map((r, index) => {
        // Validate date
        const dObj = parseBPDate(r.Date);
        if (!dObj) {
            parseErrors.push({ 
                index, 
                readingID: r.ReadingID, 
                dateString: r.Date 
            });
            return null;
        }

        // Validate numeric readings with medical ranges
        const sys = validateNumericReading(r.Sys, 'Systolic', 40, 250);
        const dia = validateNumericReading(r.Dia, 'Diastolic', 20, 150);
        const bpm = validateNumericReading(r.BPM || r.Pulse, 'BPM', 30, 200);

        if (sys === null || dia === null) {
            validationErrors.push({ 
                index, 
                readingID: r.ReadingID, 
                sys: r.Sys, 
                dia: r.Dia 
            });
            return null;
        }

        // Calculate pulse pressure
        const pulsePressure = sys - dia;

        // Calculate all categories from raw values (ignore source categories)
        const bpCategory = getBPCategory(sys, dia);
        const pulseCategory = getPulseCategory(bpm);
        const pulsePressureCategory = getPulsePressureCategory(pulsePressure);

        return {
            ...r,
            DateObj: dObj,
            Sys: sys,
            Dia: dia,
            BPM: bpm || 0,
            
            // Computed values (overwrite anything from source)
            gPulsePressure: pulsePressure,
            bpCat: bpCategory,
            pulseCat: pulseCategory,
            ppCat: pulsePressureCategory,
            
            // For backwards compatibility with existing chart code
            ReadingCategory: bpCategory.label,
            PulseCategory: pulseCategory.label,
            PulsePressureCategory: pulsePressureCategory.label
        };
    }).filter(Boolean); // Remove null entries

    // Detailed Error Reporting
    if (parseErrors.length > 0) {
        console.error(`[NORMALIZER] Failed to parse ${parseErrors.length} dates:`);
        parseErrors.slice(0, 5).forEach(err => {
            console.error(`  ReadingID ${err.readingID}: "${err.dateString}"`);
        });
        if (parseErrors.length > 5) {
            console.error(`  ... and ${parseErrors.length - 5} more`);
        }
    }

    if (validationErrors.length > 0) {
        console.error(`[NORMALIZER] ${validationErrors.length} records failed validation:`);
        validationErrors.slice(0, 5).forEach(err => {
            console.error(`  ReadingID ${err.readingID}: Sys=${err.sys}, Dia=${err.dia}`);
        });
    }

    // Success Logging & Statistics
    if (normalized.length === 0) {
        console.error('[NORMALIZER] No valid records after normalization');
        if (typeof showGlobalErrorBanner === 'function') {
            showGlobalErrorBanner('Error: No valid blood pressure readings found');
        }
        return [];
    }

    const distinctDays = new Set(
        normalized.map(r => 
            `${r.DateObj.getFullYear()}-${r.DateObj.getMonth()+1}-${r.DateObj.getDate()}`
        )
    ).size;

    console.log('[NORMALIZER] Successfully normalized:');
    console.log('  Records:', normalized.length);
    console.log('  Distinct days:', distinctDays);
    console.log('  Date range:', 
        normalized[0].DateObj.toLocaleDateString(), 
        '→', 
        normalized[normalized.length - 1].DateObj.toLocaleDateString()
    );
    
    if (parseErrors.length > 0 || validationErrors.length > 0) {
        console.warn('  Skipped records:', parseErrors.length + validationErrors.length);
    }

    return normalized;
}

// Initialize global normalized data
const normalizedData = normalizeData();

// Expose to window for backwards compatibility (will phase out)
window.NORMALIZED_BP_DATA = normalizedData;

// Also export for ES6 modules
export { normalizedData as NORMALIZED_BP_DATA };