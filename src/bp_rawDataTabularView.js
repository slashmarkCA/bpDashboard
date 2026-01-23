// bp_rawDataTabularView.js
console.log('[RAW TABLE] Script loaded. Ready to render.');

function renderRawBPTable() {
    console.log('[RAW TABLE] renderRawBPTable() called.');

    const container = document.getElementById('bpRawDataTable');
    if (!container) {
        console.error('[RAW TABLE] Error: #bpRawDataTable not found in HTML.');
        return;
    }

    // 1. Get Data
    const rawList = Array.isArray(window.NORMALIZED_BP_DATA) ? [...window.NORMALIZED_BP_DATA] : [];
    if (rawList.length === 0) {
        container.innerHTML = '<p style="padding:20px;">No data found to display.</p>';
        return;
    }

    try {
        // 2. Sort Descending (Newest first)
        rawList.sort((a, b) => (b.DateObj || 0) - (a.DateObj || 0));

        // 3. Group by Date
        const dayGroups = new Map();
        rawList.forEach(record => {
            // Determine the label for the day (e.g., "2026-01-20")
            let dayLabel = 'Unknown Date';
            if (record.DateObj instanceof Date && !isNaN(record.DateObj)) {
                // Try to use your existing util if it exists, otherwise fallback
                dayLabel = (typeof getLocalDateKey === 'function')
                    ? getLocalDateKey(record.DateObj)
                    : record.DateObj.toLocaleDateString();
            }

            if (!dayGroups.has(dayLabel)) dayGroups.set(dayLabel, []);
            dayGroups.get(dayLabel).push(record);
        });

        // 4. Build the HTML Table
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

                // Format Time safely
                let timeStr = '--:--';
                if (r.DateObj instanceof Date && !isNaN(r.DateObj)) {
                    timeStr = r.DateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                tableHtml += '<tr>';

                // Column 1: Date (Merged with Rowspan)
                if (idx === 0) {
                    tableHtml += `<td class="date-cell" rowspan="${rowsInDay.length}">${dayKey}</td>`;
                }

                // Columns 2-10: Data Points
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

        // 5. Inject into DOM
        container.innerHTML = tableHtml;
        console.log('[RAW TABLE] Success: Table rendered with ' + rawList.length + ' rows.');

    } catch (err) {
        console.error('[RAW TABLE] Render failed mid-loop:', err);
        container.innerHTML = '<div style="color:red; border:1px solid red; padding:10px;">Error generating table. Check Console (F12).</div>';
    }
}

// Final check: Run it
renderRawBPTable();
