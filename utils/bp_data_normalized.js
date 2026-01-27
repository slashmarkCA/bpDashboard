// bp_data_normalized.js
// ============================================================
// One-time normalization layer
// - Detects raw BP data automatically
// - Adds DateObj for filtering/sorting
// - Exposes NORMALIZED_BP_DATA globally
// - Added validation and error logging
// ============================================================

console.log('[NORMALIZER] loading bp_data_normalized.js');

// ------------------------------------------------------------
// 1. Detect raw BP data
// ------------------------------------------------------------
const RAW_BP_DATA =
    window.ALL_BP_DATA ||
    window.BP_DATA ||
    window.sourceData ||
    window.bpData ||
    null;

if (!Array.isArray(RAW_BP_DATA)) {
    console.error('[NORMALIZER] No raw BP data array found on window');
    window.NORMALIZED_BP_DATA = [];
} else {
    console.log('[NORMALIZER] Raw records found:', RAW_BP_DATA.length);

    // ------------------------------------------------------------
    // 2. Date parser with validation
    // ------------------------------------------------------------
    function parseBPDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') {
            console.warn('[NORMALIZER] Invalid date string:', dateStr);
            return null;
        }

        const parts = dateStr.split(' ');
        if (parts.length < 3) {
            console.warn('[NORMALIZER] Date string missing parts:', dateStr);
            return null;
        }

        const [datePart, timePart, ampm] = parts;

        // Validate date part format (YYYY-MM-DD)
        const dateComponents = datePart.split('-');
        if (dateComponents.length !== 3) {
            console.warn('[NORMALIZER] Invalid date format:', datePart);
            return null;
        }

        const [year, month, day] = dateComponents.map(Number);

        // Validate time part format (HH:MM:SS)
        const timeComponents = timePart.split(':');
        if (timeComponents.length < 2) {
            console.warn('[NORMALIZER] Invalid time format:', timePart);
            return null;
        }

        let [hour, minute, second] = timeComponents.map(Number);

        // Handle missing seconds (default to 0)
        if (isNaN(second)) second = 0;

        // Validate AM/PM
        if (!ampm || (ampm.toLowerCase() !== 'am' && ampm.toLowerCase() !== 'pm')) {
            console.warn('[NORMALIZER] Invalid AM/PM:', ampm);
            return null;
        }

        // Convert to 24-hour format
        if (ampm.toLowerCase() === 'pm' && hour !== 12) hour += 12;
        if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;

        // Create date object
        const dateObj = new Date(year, month - 1, day, hour, minute, second);

        // Validate the created date
        if (isNaN(dateObj.getTime())) {
            console.warn('[NORMALIZER] Invalid date created from:', dateStr);
            return null;
        }

        return dateObj;
    }

    // ------------------------------------------------------------
    // 3. Normalize once
    // ------------------------------------------------------------
    const parseErrors = [];

    window.NORMALIZED_BP_DATA = RAW_BP_DATA
        .map((r, index) => {
            // HARDENING: Check for missing required fields before processing
            if (!r || !r.Date || r.Sys === undefined || r.Dia === undefined) {
                parseErrors.push({ 
                    index, 
                    readingID: r?.ReadingID || 'Unknown', 
                    dateString: 'MISSING DATA' 
                });
                return null;
            }

            const d = parseBPDate(r.Date);
            
            // Validate the result of the parser
            if (!(d instanceof Date) || isNaN(d.getTime())) {
                parseErrors.push({
                    index,
                    readingID: r.ReadingID,
                    dateString: r.Date
                });
                return null;
            }

            // Return cleaned row with numbers forced to actual Number types for math safety
            return {
                ...r,
                DateObj: d,
                Sys: Number(r.Sys),
                Dia: Number(r.Dia),
                Pulse: Number(r.BPM || r.Pulse || 0)
            };
        })
        .filter(Boolean); // Cleanly removes the "null" rows from the final array

    // ------------------------------------------------------------
    // 4. Final validation / logging
    // ------------------------------------------------------------
    if (parseErrors.length > 0) {
        console.error('[NORMALIZER] Failed to parse', parseErrors.length, 'dates:');
        parseErrors.forEach(err => {
            console.error(`  ReadingID ${err.readingID}: "${err.dateString}"`);
        });
    }

    if (window.NORMALIZED_BP_DATA.length === 0) {
        console.warn('[NORMALIZER] Normalized data is empty');
    } else {
        const distinctDays = new Set(
            window.NORMALIZED_BP_DATA.map(r =>
                r.DateObj.getFullYear() + '-' +
                String(r.DateObj.getMonth() + 1).padStart(2, '0') + '-' +
                String(r.DateObj.getDate()).padStart(2, '0')
            )
        ).size;

        console.log('[NORMALIZER] Successfully normalized:');
        console.log('  Records:', window.NORMALIZED_BP_DATA.length);
        console.log('  Distinct days:', distinctDays);
        console.log('  Date range:',
            window.NORMALIZED_BP_DATA[0].DateObj.toLocaleDateString(),
            '→',
            window.NORMALIZED_BP_DATA.at(-1).DateObj.toLocaleDateString()
        );

        if (parseErrors.length > 0) {
            console.warn('  Parse errors:', parseErrors.length);
        }
    }
}