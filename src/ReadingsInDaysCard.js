/* ============================================================================
   ReadingsInDaysCard.js
   ---------------------------------------------------------------------------
   Displays:
   - Number of filtered readings
   - Number of DISTINCT calendar days with readings (not span!)
   ============================================================================ */

console.log('ReadingsInDaysCard.js loaded');

function updateReadingsInDaysCard(filteredData) {
    const container = document.getElementById('readingsInDaysCard');
    if (!container) return;

    const readingCount = filteredData.length;

    if (readingCount === 0) {
        container.innerHTML = `
            ⚠️<br>
            <span style="font-family:'Trebuchet MS', Tahoma, arial; font-size:11px;">
                Sorry, a reading hasn't been taken in some time.<br>
                Pick another date range.
            </span>
        `;
        return;
    }

    // ✅ COUNT DISTINCT DAYS (not span!)
    const distinctDays = new Set(filteredData.map(r => getLocalDateKey(r.DateObj))).size;

    container.innerHTML = `
        <div class="design6-container">
            <div class="design6">
                <div class="badge badge-gray">
                    <div class="number" id="readings">${readingCount}</div>
                    <div class="label">readings</div>
                </div>
                <div class="badge badge-dark">
                    <div class="number" id="days">${distinctDays}</div>
                    <div class="label">days</div>
                </div>
            </div>
        </div>
    `;

    resizeBadgeNumbers(readingCount, distinctDays);
}

/* ---------------------------------------------------------------------------
   Font scaling helper
--------------------------------------------------------------------------- */
function resizeBadgeNumbers(readings, days) {
    const availableWidth = 70;

    const readingsEl = document.getElementById('readings');
    const daysEl = document.getElementById('days');

    if (readingsEl) {
        const digits = readings.toString().length;
        readingsEl.style.fontSize =
            Math.max(Math.min(availableWidth / (digits * 0.6), 85), 24) + 'px';
    }

    if (daysEl) {
        const digits = days.toString().length;
        daysEl.style.fontSize =
            Math.max(Math.min(availableWidth / (digits * 0.6), 85), 24) + 'px';
    }
}