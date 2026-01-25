/**
 * Updates the 4 metric cards (SYS, DIA, BPM, PP) 
 * Precise targeting preserves the <br> tags in index.html
 */
function update5ColAggregateSummary(filteredData) {
    if (!filteredData || filteredData.length === 0) {
        ['sys', 'dia', 'pulse', 'pp'].forEach(key => {
            const elements = [`${key}-high`, `${key}-low`, `${key}-avg`].map(id => document.getElementById(id));
            elements.forEach(el => { if(el) el.innerText = '--'; });
        });
        return;
    }

    // 1. Updated Config: Added lowLimit to catch values like 57
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

        // 2. Update High
        const highEl = document.getElementById(`${key}-high`);
        if (highEl) {
            highEl.innerText = high;
            highEl.style.color = (high >= config.limit) ? '#c70000' : 'inherit';
        }

        // 3. Update Low (Now with warning check for values like 57)
        const lowEl = document.getElementById(`${key}-low`);
        if (lowEl) {
            lowEl.innerText = low;
            lowEl.style.color = (low <= config.lowLimit) ? '#c70000' : 'inherit';
        }

        // 4. Update Average (FIX: Adding the missing style logic for Line 44)
        const avgEl = document.getElementById(`${key}-avg`);
        if (avgEl) {
            avgEl.innerText = avg;
            
            // Check if Avg is either too high OR too low
            const isWarning = avgNum >= config.limit || avgNum <= config.lowLimit;
            
            avgEl.style.color = isWarning ? '#c70000' : 'inherit';
            
            // Fix: Using explicit sizes ensures it doesn't shrink back to browser default
            avgEl.style.fontSize = isWarning ? '42px' : '35px';
            avgEl.style.fontWeight = isWarning ? '800' : 'normal';
        }
    });
}

// Global expose for dispatcher
window.update5ColAggregateSummary = update5ColAggregateSummary;