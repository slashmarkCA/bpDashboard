/* ============================================================================
   bp_rawDataTabularView.js
   ---------------------------------------------------------------------------
   Raw Data Table plus calculated clinical literal categories from measurements
   - No longer depends on source data category fields from original data source
   - Groups by date with rowspan
   - Highlights risky readings
   - Pure DOM manipulation (no Chart.js)

   DATE HANDLING NOTES (important - do not regress):
   -------------------------------------------------
   Date grouping uses getLocalDateKey(record.DateObj) from bp_utils.js.
   This uses getFullYear/getMonth/getDate (local time components), NOT ISO string
   conversion or r.Date.split(' ')[0] from the raw JSON field.

   WHY: Readings taken close to midnight in EST (GMT-5) would appear on the
   wrong day if converted via toISOString() because JS Date internals are UTC.
   A reading at "2026-02-27 11:45:00 PM" EST is still Feb 27 locally, but
   ISO conversion shifts it to Feb 28 UTC — causing it to group under the wrong date.

   THE PIPELINE:
     Google Sheet → Apps Script ETL → GitHub /data/bp_readings.json
     JSON "Date" field format: "YYYY-MM-DD HH:MM:SS AM/PM"  e.g. "2025-07-24 05:00:01 PM"
     bp_data_normalized.js parses this into DateObj (local Date object)
     All downstream code (filters, charts, table, heatmap) must use DateObj only.

   THE STANDARD: getLocalDateKey(dateObj) → "YYYY-MM-DD" (locale-safe)
   See also: bp_filters.js toDayKey(), bp_heatmap.js daily aggregation.
   ============================================================================ */

import { getBPCategory, getPulseCategory, getPulsePressureCategory, getLocalDateKey } from '../utils/bp_utils.js';

export function renderRawBPTable() {
    const container = document.getElementById('bpRawDataTable');
    if (!container) {
        console.error('[RAW TABLE] Error: #bpRawDataTable not found in HTML.');
        return;
    }

    // Get normalized data
    const rawList = Array.isArray(window.NORMALIZED_BP_DATA) ? [...window.NORMALIZED_BP_DATA] : [];
    if (rawList.length === 0) {
        container.innerHTML = '<p style="padding:20px;">No data found to display.</p>';
        return;
    }

    try {
        // Sort descending (newest first)
        rawList.sort((a, b) => (b.DateObj || 0) - (a.DateObj || 0));

        // Group by local calendar date using getLocalDateKey() from bp_utils.js.
        // NOT using ISO/UTC conversion - see DATE HANDLING NOTES in header above.
        // Consistent with bp_filters.js toDayKey() and bp_heatmap.js aggregation.
        const dayGroups = new Map();
        rawList.forEach(record => {
            const dayLabel = (record.DateObj instanceof Date && !isNaN(record.DateObj))
                ? getLocalDateKey(record.DateObj)
                : 'Unknown Date';

            if (!dayGroups.has(dayLabel)) dayGroups.set(dayLabel, []);
            dayGroups.get(dayLabel).push(record);
        });

        // Build table HTML
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
                            <th class="hide-mobile">BP Category</th>
                            <th class="hide-mobile">Pulse Category</th>
                            <th class="hide-mobile">PP Category</th>
                            <th class="hide-mobile">Work</th>
                            <th class="comments-col hide-mobile">Comments</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        dayGroups.forEach((rowsInDay, dayKey) => {
            rowsInDay.forEach((r, idx) => {
                // Calculate categories on-the-fly from normalized values.
                // This file does NOT rely on category fields from the source JSON.
                const bpCat = getBPCategory(r.Sys, r.Dia);
                const pulseCat = getPulseCategory(r.BPM);
                const pulsePressure = r.Sys - r.Dia;
                const ppCat = getPulsePressureCategory(pulsePressure);
                
                const isHigh = (r.Sys >= 140 || r.Dia >= 90);

                // Format time from DateObj - NOT from r.Date string split
                let timeStr = '--:--';
                if (r.DateObj instanceof Date && !isNaN(r.DateObj)) {
                    timeStr = r.DateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                tableHtml += '<tr>';

                // Date column - merged across all readings for this day using rowspan
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
                    <td class="hide-mobile">${pulsePressure || ''}</td>
                    <td class="category-cell hide-mobile">${bpCat.label}</td>
                    <td class="hide-mobile">${pulseCat.label}</td>
                    <td class="hide-mobile">${ppCat.label}</td>
                    <td class="hide-mobile">${r.Workday || ''}</td>
                    <td class="comments-col hide-mobile">${r.FormComments || ''}</td>
                `;

                tableHtml += '</tr>';
            });
        });

        tableHtml += `</tbody></table></div>`;

        // Inject into DOM
        container.innerHTML = tableHtml;
        console.log('[RAW TABLE] Rendered successfully with', rawList.length, 'rows');

    } catch (err) {
        console.error('[RAW TABLE] Render failed:', err);
        container.innerHTML = '<div style="color:red; border:1px solid red; padding:10px;">Error generating table. Check Console (F12).</div>';
    }
}

// Auto-run on module load
renderRawBPTable();