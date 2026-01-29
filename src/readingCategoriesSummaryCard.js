import { BP_LEVELS } from '../utils/bp_utils.js';

/**
 * Summary card showing the distribution of BP categories.
 * Now pulls labels and colors from the Central Source of Truth.
 */
export function updateReadingCategoriesSummaryCard(filteredData) {
    renderReadingCategoriesSummary(filteredData);
}

function renderReadingCategoriesSummary(filteredData) {
    const container = document.getElementById('readingCategoriesSummaryCard');
    if (!container) return;

    container.innerHTML = '';

    // Convert BP_LEVELS object into a sorted array for the display list
    // We sort by score (highest risk at top) or reversed if you prefer.
    const categories = Object.values(BP_LEVELS)
        .filter(cat => cat.score > 0) // Exclude "Unknown"
        .sort((a, b) => b.score - a.score);

    const total = filteredData.length || 1;
    const counts = {};
    categories.forEach(c => counts[c.label] = 0);

    // Use the normalized bpCat object we attached in bp_data_normalized.js
    filteredData.forEach(r => {
        if (r.bpCat && counts[r.bpCat.label] !== undefined) {
            counts[r.bpCat.label]++;
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
            grid-template-columns: minmax(115px, 1.2fr) 20px 30px 2.5fr;
            align-items:center;
            gap:8px;
            border-bottom:${i < categories.length - 1 ? '1px solid #c4c4c4' : 'none'};
            padding:0 6px;
        `;

        row.innerHTML = `
            <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${cat.label}</div>
            <div style="text-align:right;">${count}</div>
            <div style="text-align:right;">${pct}%</div>
            <div style="height:10px; background:#eeeeee; border-radius:2px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:${cat.color};"></div>
            </div>
        `;
        table.appendChild(row);
    });

    container.appendChild(table);
}

// Keep the global hook for the dispatcher
window.updateReadingCategoriesSummaryCard = updateReadingCategoriesSummaryCard;