// bp_filters.js
// ============================================================
// Centralized date filtering logic
// CONTRACT:
// - Calendar-day based
// - Last N days WITH readings (no empty-day padding)
// - Include ALL readings within each included day
// - Return [] if no data in range
// ============================================================

console.log('[FILTER] loading bp_filters.js');

let currentFilter = 'last7days';

/* ------------------------------------------------------------
   Canonical data source
------------------------------------------------------------ */
const SOURCE_DATA = Array.isArray(window.NORMALIZED_BP_DATA)
    ? window.NORMALIZED_BP_DATA
    : [];

if (!SOURCE_DATA.length) {
    console.warn('[FILTER INIT] No normalized BP data found');
}

/* ------------------------------------------------------------
   Public accessor
------------------------------------------------------------ */
function getCurrentFilter() {
    return currentFilter;
}

/* ------------------------------------------------------------
   Core filter - Now Calendar Aligned.
------------------------------------------------------------ */
function getFilteredBPData(range) {
    if (!SOURCE_DATA.length) return [];

    // "All" stays the same
    if (range === 'all') {
        return [...SOURCE_DATA].sort((a, b) => a.DateObj - b.DateObj);
    }

    const daysRequired = {
        last7days: 7,
        last14days: 14,
        last30days: 30
    }[range];

    if (!daysRequired) return [];

    // Use our new utility to get the strict calendar window
    const window = getCalendarRange(new Date(), daysRequired);

    // Filter data strictly within that window
    const result = SOURCE_DATA.filter(r => 
        r.DateObj >= window.start && r.DateObj <= window.end
    );

    // Keep it sorted for the charts
    result.sort((a, b) => a.DateObj - b.DateObj);
    return result;
}

/* ------------------------------------------------------------
   UI wiring
------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.date-pill');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentFilter = btn.dataset.filter || 'last7days';

            const filtered = getFilteredBPData(currentFilter);

            console.log(
                `[FILTER] ${currentFilter}`,
                `Days: ${new Set(filtered.map(r => getLocalDateKey(r.DateObj))).size}`,
                `Readings: ${filtered.length}`
            );

            updateAllCharts(filtered);
        });
    });

    // Initial render
    const initial = getFilteredBPData(currentFilter);
    updateAllCharts(initial);
});

console.log('[FILTER] ready');