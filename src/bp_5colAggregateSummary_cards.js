/**
 * Updates the 4 metric cards (SYS, DIA, BPM, PP) 
 * Precise targeting preserves the <br> tags in index.html
 */
function update5ColAggregateSummary(filteredData) {
    // 1. Safety Check: If no data, reset to placeholder and exit
    if (!filteredData || filteredData.length === 0) {
        ['sys', 'dia', 'pulse', 'pp'].forEach(key => {
            const elements = [`${key}-high`, `${key}-low`, `${key}-avg`].map(id => document.getElementById(id));
            elements.forEach(el => { if(el) el.innerText = '--'; });
        });
        return;
    }

    // 2. Data Mapping & Thresholds
    // NOTE: 'd.Pulse' must match your exact CSV/JSON key name.
    const statsConfig = {
        sys: { vals: filteredData.map(d => Number(d.Sys)).filter(v => !isNaN(v)), limit: 140 },
        dia: { vals: filteredData.map(d => Number(d.Dia)).filter(v => !isNaN(v)), limit: 90 },
        pulse: { vals: filteredData.map(d => Number(d.BPM)).filter(v => !isNaN(v)), limit: 100 },
        pp: { vals: filteredData.map(d => Number(d.Sys - d.Dia)).filter(v => !isNaN(v)), limit: 60 }
    };

    Object.keys(statsConfig).forEach(key => {
        const config = statsConfig[key];
        
        // Ensure we have numbers to calculate
        if (config.vals.length === 0) return;

        const high = Math.max(...config.vals);
        const low = Math.min(...config.vals);
        const avg = (config.vals.reduce((a, b) => a + b, 0) / config.vals.length).toFixed(1);

        // Update High (target the SPAN id)
        const highEl = document.getElementById(`${key}-high`);
        if (highEl) {
            highEl.innerText = high;
            highEl.style.color = (high >= config.limit) ? '#c70000' : 'inherit';
        }

        // Update Low (target the SPAN id)
        const lowEl = document.getElementById(`${key}-low`);
        if (lowEl) lowEl.innerText = low;

        // Update Average (target the SPAN id)
        const avgEl = document.getElementById(`${key}-avg`);
        if (avgEl) {
            avgEl.innerText = avg;
            avgEl.style.color = (parseFloat(avg) >= config.limit) ? '#c70000' : 'inherit';
        }
    });
}

// Global expose for dispatcher
window.update5ColAggregateSummary = update5ColAggregateSummary;