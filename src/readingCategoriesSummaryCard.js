// readingCategoriesSummaryCard.js
function updateReadingCategoriesSummaryCard(filteredData) {
    renderReadingCategoriesSummary(filteredData);
}

function renderReadingCategoriesSummary(filteredData) {
    const container = document.getElementById('readingCategoriesSummaryCard');
    if (!container) return;

    container.innerHTML = '';

    const categories = [
        { label: 'Normal', color: '#30693c' },
        { label: 'Elevated', color: '#204929' },
        { label: 'Hypertension Stage 1', color: '#eeb649' },
        { label: 'Hypertension Stage 2', color: '#d95139' },
        { label: 'Hypertensive Crisis', color: '#ad322d' }
    ];

    const total = filteredData.length || 1;
    const counts = {};
    categories.forEach(c => counts[c.label] = 0);

    filteredData.forEach(r => {
        if (counts[r.ReadingCategory] !== undefined) {
            counts[r.ReadingCategory]++;
        }
    });

    const table = document.createElement('div');
    table.style.cssText = `
        width:100%;
        height:100%;
        display:grid;
        grid-template-rows: repeat(${categories.length}, 1fr);
        font-family:'Trebuchet MS', Tahoma, arial;
        font-size:12px;
        color:#666666;
    `;

    categories.forEach((cat, i) => {
        const count = counts[cat.label];
        const pct = Math.round((count / total) * 100);

        const row = document.createElement('div');
        row.style.cssText = `
            display:grid;
            grid-template-columns: minmax(80px, 1.2fr) 35px 45px 2.5fr;
            align-items:center;
            gap:8px;
            border-bottom:${i < categories.length - 1 ? '1px solid #c4c4c4' : 'none'};
            padding:0 6px;
        `;

        row.innerHTML = `
            <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${cat.label}</div>
            <div style="text-align:right;">${count}</div>
            <div style="text-align:right;">${pct}%</div>
            <div style="height:12px; background:#eee; border-radius:2px; overflow:hidden; margin-left:4px;">
                <div style="width:${pct}%; height:100%; background:${cat.color};"></div>
            </div>
        `;
        table.appendChild(row);
    });

    container.appendChild(table);
}