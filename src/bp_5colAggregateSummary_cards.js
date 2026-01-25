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

        // 1. Determine if ANY value in this category is a warning
        const highWarning = high >= config.limit;
        const lowWarning = low <= config.lowLimit;
        const avgWarning = avgNum >= config.limit || avgNum <= config.lowLimit;
        
        // The "Master" warning for the card badge
        const anyWarning = highWarning || lowWarning || avgWarning;

        // 2. Update High Display
        const highEl = document.getElementById(`${key}-high`);
        if (highEl) {
            highEl.innerText = high;
            highEl.style.color = highWarning ? '#c70000' : 'inherit';
        }

        // 3. Update Low Display
        const lowEl = document.getElementById(`${key}-low`);
        if (lowEl) {
            lowEl.innerText = low;
            lowEl.style.color = lowWarning ? '#c70000' : 'inherit';
        }

        // 4. Update Average & Card Badge
        const avgEl = document.getElementById(`${key}-avg`);
        const warningBadge = document.getElementById(`${key}-warning`);

        if (avgEl) {
            avgEl.innerText = avg;
            avgEl.style.color = avgWarning ? '#c70000' : 'inherit';
            avgEl.style.fontSize = avgWarning ? '42px' : '35px';
            avgEl.style.fontWeight = avgWarning ? '800' : 'normal';
        }

        // Show the badge if ANY of the three triggered a warning
        if (warningBadge) {
            warningBadge.style.display = anyWarning ? 'block' : 'none';
        }
    });
}

// Global expose for dispatcher
window.update5ColAggregateSummary = update5ColAggregateSummary;