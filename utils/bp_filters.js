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
   Core filter - Volume-Based (Last N Days with Data)
   It reverts to grouping by day and slicing the most recent "Data Days."
------------------------------------------------------------ */
function getFilteredBPData(range) {
    if (!SOURCE_DATA.length) return [];

    if (range === 'all') {
        return [...SOURCE_DATA].sort((a, b) => a.DateObj - b.DateObj);
    }

    const daysRequired = {
        last7days: 7,
        last14days: 14,
        last30days: 30
    }[range];

    if (!daysRequired) return [];

    // 1. Group all available data by local date key
    const byDay = new Map();
    SOURCE_DATA.forEach(r => {
        const key = getLocalDateKey(r.DateObj); // Uses util to strip time
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key).push(r);
    });

    // 2. Sort unique dates newest to oldest
    const sortedDays = Array.from(byDay.keys()).sort((a, b) => b.localeCompare(a));

    // 3. Take the N most recent days that actually have readings
    const selectedDays = sortedDays.slice(0, daysRequired);

    if (!selectedDays.length) return [];

    // 4. Flatten the readings from those selected days back into a single array
    const result = [];
    selectedDays.forEach(dayKey => {
        result.push(...byDay.get(dayKey));
    });

    // 5. Return sorted oldest to newest for Chart.js
    return result.sort((a, b) => a.DateObj - b.DateObj);
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