/* ============================================================================
   bp_rawDataTabularView.js
   ---------------------------------------------------------------------------
   Raw Data Table View
   - Displays all readings in tabular format
   - Groups by date with rowspan
   - Highlights risky readings
   - Pure DOM manipulation (no Chart.js)
   ============================================================================ */

import { getLocalDateKey } from '../utils/bp_utils.js';

/**
 * Renders the raw BP data table
 * Note: Uses global NORMALIZED_BP_DATA (not filtered) to show all records
 */
export function renderRawBPTable() {
    const container = document.getElementById('bpRawDataTable');
    if (!container) {
        console.error('[RAW TABLE] Container #bpRawDataTable not found');
        return;
    }

    // Get all normalized data
    const rawList = Array.isArray(window.NORMALIZED_BP_DATA) ? [...window.NORMALIZED_BP_DATA] : [];
    
    if (rawList.length === 0) {
        container.innerHTML = '<p style="padding:20px;">No data found to display.</p>';
        console.warn('[RAW TABLE] No data available');
        return;
    }

    try {
        // Sort descending (newest first)
        rawList.sort((a, b) => (b.DateObj || 0) - (a.DateObj || 0));

        // Group by date
        const dayGroups = new Map();
        rawList.forEach(record => {
            let dayLabel = 'Unknown Date';
            if (record.DateObj instanceof Date && !isNaN(record.DateObj)) {
                dayLabel = getLocalDateKey(record.DateObj) || record.DateObj.toLocaleDateString();
            }

            if (!dayGroups.has(dayLabel)) dayGroups.set(dayLabel, []);
            dayGroups.get(dayLabel).push(record);
        });

        // Build HTML table
        let tableHtml = `
            <div class="bp-raw-table-wrapper">
                <table class="bp-raw-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th class="hide-mobile">ID</th>
                            <th>Time</th>
                            <th>Sys</th>
                            <th>Dia</th>
                            <th>BPM</th>
                            <th class="hide-mobile">PP</th>
                            <th class="hide-mobile">Category</th>
                            <th class="hide-mobile">Work</th>
                            <th class="comments-col hide-mobile">Comments</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        dayGroups.forEach((rowsInDay, dayKey) => {
            rowsInDay.forEach((r, idx) => {
                const isHigh = (r.Sys >= 140 || r.Dia >= 90);

                // Format time safely
                let timeStr = '--:--';
                if (r.DateObj instanceof Date && !isNaN(r.DateObj)) {
                    timeStr = r.DateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                tableHtml += '<tr>';

                // Date column (merged with rowspan)
                if (idx === 0) {
                    tableHtml += `<td class="date-cell" rowspan="${rowsInDay.length}">${dayKey}</td>`;
                }

                // Data columns
                tableHtml += `
                    <td class="hide-mobile">${r.ReadingID || ''}</td>
                    <td class="time-cell">${timeStr}</td>
                    <td class="${isHigh ? 'bp-risk' : ''}">${r.Sys || ''}</td>
                    <td class="${isHigh ? 'bp-risk' : ''}">${r.Dia || ''}</td>
                    <td>${r.BPM || ''}</td>
                    <td class="hide-mobile">${r.gPulsePressure || ''}</td>
                    <td class="category-cell hide-mobile">${r.ReadingCategory || ''}</td>
                    <td class="hide-mobile">${r.Workday || ''}</td>
                    <td class="comments-col hide-mobile">${r.FormComments || ''}</td>
                `;

                tableHtml += '</tr>';
            });
        });

        tableHtml += `</tbody></table></div>`;

        // Inject into DOM
        container.innerHTML = tableHtml;
        console.log('[Trace] bp_rawDataTabularView.js rendered successfully with', rawList.length, 'rows');

    } catch (err) {
        console.error('[RAW TABLE] Render failed:', err);
        container.innerHTML = '<div style="color:red; border:1px solid red; padding:10px;">Error generating table. Check Console (F12).</div>';
    }
}