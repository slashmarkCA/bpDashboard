// bp_periodAggregateSummary_card.js
// ============================================================
// Averages and Aggregates summary card - GRID SYNC + WARNINGS
// ============================================================

console.log('[CARD] loading bp_periodAggregateSummary_card.js');

function updatePeriodAggregateSummaryCard(filteredData) {
    const container = document.getElementById('periodAggregateSummaryCard');
    if (!container) return;

    container.innerHTML = '';

    if (!Array.isArray(filteredData) || filteredData.length === 0) {
        container.innerHTML = `
            <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-family:'Trebuchet MS', Tahoma, arial; font-size:12px; color:#666; text-align:center;">
                ⚠️<br>No readings in this period
            </div>
        `;
        return;
    }

    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const round1 = v => Math.round(v * 10) / 10;

    const values = {
        sys: filteredData.map(r => r.Sys),
        dia: filteredData.map(r => r.Dia),
        bpm: filteredData.map(r => r.BPM)
    };

    const stats = {
        sys: { avg: round1(avg(values.sys)), high: Math.max(...values.sys), low: Math.min(...values.sys) },
        dia: { avg: round1(avg(values.dia)), high: Math.max(...values.dia), low: Math.min(...values.dia) },
        bpm: { avg: round1(avg(values.bpm)), high: Math.max(...values.bpm), low: Math.min(...values.bpm) }
    };

    // restored warning logic
    const warnSys = v => v >= 140 ? ' ⚠️' : '';
    const warnDia = v => v >= 90 ? ' ⚠️' : '';
    const warnBPM = v => (v <= 60 || v >= 100) ? ' ⚠️' : '';

    const table = document.createElement('div');
    table.style.cssText = `
        width:100%;
        height:100%;
        display:grid;
        grid-template-rows: repeat(4, 1fr);
        font-family:'Trebuchet MS', Tahoma, arial;
        font-size:12px;
        color:#666666;
    `;

    // We build the strings here so the icons are part of the value passed to the row
    const rows = [
        { label: ' ', avg: 'Avg', high: 'High', low: 'Low', isHeader: true },
        {
            label: 'Systolic',
            avg: stats.sys.avg + warnSys(stats.sys.avg),
            high: stats.sys.high + warnSys(stats.sys.high),
            low: stats.sys.low + warnSys(stats.sys.low)
        },
        {
            label: 'Diastolic',
            avg: stats.dia.avg + warnDia(stats.dia.avg),
            high: stats.dia.high + warnDia(stats.dia.high),
            low: stats.dia.low + warnDia(stats.dia.low)
        },
        {
            label: 'Beats / Min',
            avg: stats.bpm.avg + warnBPM(stats.bpm.avg),
            high: stats.bpm.high + warnBPM(stats.bpm.high),
            low: stats.bpm.low + warnBPM(stats.bpm.low)
        }
    ];

    rows.forEach((r, i) => {
        const rowDiv = document.createElement('div');
        rowDiv.style.cssText = `
            display:grid;
            grid-template-columns: minmax(80px, 1.2fr) 1fr 1fr 1fr;
            align-items:center;
            border-bottom: ${i < rows.length - 1 ? '1px solid #c4c4c4' : 'none'};
            padding: 0 6px;
            background: ${r.isHeader ? '#f8f9fa' : 'transparent'};
            font-weight: ${r.isHeader ? 'bold' : 'normal'};
        `;

        rowDiv.innerHTML = `
            <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.label}</div>
            <div style="text-align:right;">${r.avg}</div>
            <div style="text-align:right; color:${r.isHeader ? 'inherit' : '#d32f2f'};">${r.high}</div>
            <div style="text-align:right; color:${r.isHeader ? 'inherit' : '#1976d2'};">${r.low}</div>
        `;
        table.appendChild(rowDiv);
    });

    container.appendChild(table);
}

console.log('[CARD] bp_periodAggregateSummary_card.js ready');