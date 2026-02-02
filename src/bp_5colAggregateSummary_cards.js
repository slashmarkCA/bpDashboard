/* ============================================================================
   bp_5colAggregateSummary_cards.js
   ---------------------------------------------------------------------------
   Five-Column Summary Cards (SYS, DIA, BPM, PP)
   - High/Low/Average calculations
   - Warning badge display for out-of-range values
   - No Chart.js dependency
   ============================================================================ */

/**
 * Updates the 4 metric summary cards
 * @param {Array} filteredData - Filtered BP data
 */
export function create5ColAggregateSummary(filteredData) {
    // Handle empty data - reset all cards to '--'
    if (!filteredData || filteredData.length === 0) {
        ['sys', 'dia', 'pulse', 'pp'].forEach(key => {
            const elements = [`${key}-high`, `${key}-low`, `${key}-avg`].map(id => document.getElementById(id));
            elements.forEach(el => { if(el) el.innerText = '--'; });
            
            // Hide warning badges
            const badge = document.getElementById(`${key}-warning`);
            if (badge) badge.style.display = 'none';
        });
        return;
    }

    // Configuration with medical thresholds
    const statsConfig = {
        sys:   { vals: filteredData.map(d => Number(d.Sys)).filter(v => !isNaN(v)), limit: 140, lowLimit: 90 },
        dia:   { vals: filteredData.map(d => Number(d.Dia)).filter(v => !isNaN(v)), limit: 90,  lowLimit: 60 },
        pulse: { vals: filteredData.map(d => Number(d.BPM)).filter(v => !isNaN(v)), limit: 100, lowLimit: 60 },
        pp:    { vals: filteredData.map(d => Number(d.Sys - d.Dia)).filter(v => !isNaN(v)), limit: 60, lowLimit: 30 }
    };

    Object.keys(statsConfig).forEach(key => {
        const config = statsConfig[key];
        if (config.vals.length === 0) return;

        const high = Math.max(...config.vals);
        const low = Math.min(...config.vals);
        const avg = (config.vals.reduce((a, b) => a + b, 0) / config.vals.length).toFixed(1);
        const avgNum = parseFloat(avg);

        // Determine warnings
        const highWarning = high >= config.limit;
        const lowWarning = low <= config.lowLimit;
        const avgWarning = avgNum >= config.limit || avgNum <= config.lowLimit;
        const anyWarning = highWarning || lowWarning || avgWarning;

        // Update High display
        const highEl = document.getElementById(`${key}-high`);
        if (highEl) {
            highEl.innerText = high;
            highEl.style.color = highWarning ? '#c70000' : 'inherit';
        }

        // Update Low display
        const lowEl = document.getElementById(`${key}-low`);
        if (lowEl) {
            lowEl.innerText = low;
            lowEl.style.color = lowWarning ? '#c70000' : 'inherit';
        }

        // Update Average display
        const avgEl = document.getElementById(`${key}-avg`);
        if (avgEl) {
            avgEl.innerText = avg;
            avgEl.style.color = avgWarning ? '#c70000' : 'inherit';
            avgEl.style.fontSize = '35px';
            avgEl.style.fontWeight = 'normal';
        }

        // Update warning badge
        const warningBadge = document.getElementById(`${key}-warning`);
        if (warningBadge) {
            warningBadge.style.display = anyWarning ? 'block' : 'none';
        }
    });
    
    console.log('[Trace] bp_5colAggregateSummary_cards.js rendered successfully');
}