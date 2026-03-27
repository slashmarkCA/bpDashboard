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
import { showGlobalErrorBanner } from './errorHandling.js';

/**
 * Robust Date Parser
 * Handles format: "YYYY-MM-DD HH:MM:SS AM/PM"
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
 */
function validateNumericReading(value, fieldName, min, max) {
    const num = Number(value);
    
    if (isNaN(num)) {
        console.error(`[VALIDATOR] ${fieldName} is not a number:`, value);
        return null;
    }
    
    if (num < min || num > max) {
        console.warn(`[VALIDATOR] ${fieldName} out of range (${min}-${max}):`, num);
        if (num < 0 || num > max * 2) return null;
    }
    
    return num;
}

/**
 * Main normalization function
 * Processes raw BP data with comprehensive validation
 * @param {Array} rawData - The raw JSON array from the loader
 * @returns {Array} Normalized and validated BP records
 */
export function normalizeData(rawData) {
    const RAW_BP_DATA = rawData || [];
    
    if (!Array.isArray(RAW_BP_DATA) || RAW_BP_DATA.length === 0) {
        console.error('[NORMALIZER] No valid raw BP data provided');
        showGlobalErrorBanner('Critical: Blood pressure data could not be processed.');
        return [];
    }

    const parseErrors = [];
    const validationErrors = [];
    
    const normalized = RAW_BP_DATA.map((r, index) => {
        const dObj = parseBPDate(r.Date);
        if (!dObj) {
            parseErrors.push({ index, readingID: r.ReadingID, dateString: r.Date });
            return null;
        }

        const sys = validateNumericReading(r.Sys, 'Systolic', 40, 250);
        const dia = validateNumericReading(r.Dia, 'Diastolic', 20, 150);
        const bpm = validateNumericReading(r.BPM || r.Pulse, 'BPM', 30, 200);

        if (sys === null || dia === null) {
            validationErrors.push({ index, readingID: r.ReadingID, sys: r.Sys, dia: r.Dia });
            return null;
        }

        return {
            ...r,
            DateObj: dObj,
            Sys: sys,
            Dia: dia,
            BPM: bpm || 0,
            bpCat: getBPCategory(sys, dia),
            pulseCat: getPulseCategory(bpm),
            ppCat: getPulsePressureCategory(sys - dia)
        };
    }).filter(Boolean);

    if (normalized.length === 0) {
        showGlobalErrorBanner('Error: No valid blood pressure readings found after processing.');
        return [];
    }

    // Set global for console debugging/backwards compatibility
    window.NORMALIZED_BP_DATA = normalized;

    console.log('[NORMALIZER] Successfully normalized:', normalized.length, 'records');
    return normalized;
}