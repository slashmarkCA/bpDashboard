/* ============================================================================
   readingCategoriesSummaryCard.js
   ---------------------------------------------------------------------------
   Reading Categories Summary Card
   - Displays distribution of BP categories
   - Uses BP_LEVELS for consistent colors and labels
   - Pure DOM manipulation (no Chart.js)
   ============================================================================ */

import { BP_LEVELS } from '../utils/bp_utils.js';

/**
 * Renders the reading categories summary card
 * @param {Array} filteredData - Filtered BP data
 */
export function renderReadingCategoriesSummary(filteredData) {
    const container = document.getElementById('readingCategoriesSummaryCard');
    if (!container) {
        console.error('[CATEGORIES SUMMARY] Container #readingCategoriesSummaryCard not found');
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Handle empty data
    if (!filteredData?.length) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No data available</p>';
        console.warn('[CATEGORIES SUMMARY] No data available');
        return;
    }

    // Get categories sorted by score (highest risk first)
    const categories = Object.values(BP_LEVELS)
        .filter(cat => cat.score > 0) // Exclude "Unknown"
        .sort((a, b) => b.score - a.score);

    const total = filteredData.length;
    const counts = {};
    categories.forEach(c => counts[c.label] = 0);

    // Count occurrences using normalized bpCat
    filteredData.forEach(r => {
        if (r.bpCat && counts[r.bpCat.label] !== undefined) {
            counts[r.bpCat.label]++;
        }
    });

    // Build table
    const table = document.createElement('div');
    table.style.cssText = `
        width:100%;
        height:100%;
        display:grid;
        grid-template-rows: repeat(${categories.length}, 1fr);
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
            border-bottom:${i < categories.length - 1 ? '1px solid #3D444D' : 'none'};
            padding:0 6px;
            color: #686e75;
        `;

        row.innerHTML = `
            <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${cat.label}</div>
            <div style="text-align:right;">${count}</div>
            <div style="text-align:right;">${pct}%</div>
            <div style="height:10px; background:#3f464e; border-radius:2px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:${cat.color};"></div>
            </div>
        `;
        table.appendChild(row);
    });

    container.appendChild(table);
    console.log('[Trace] readingCategoriesSummaryCard.js rendered successfully');
}