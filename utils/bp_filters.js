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
   Core filter
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

    const byDay = new Map();

    SOURCE_DATA.forEach(r => {
        const key = getLocalDateKey(r.DateObj);
        if (!key) return;

        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key).push(r);
    });

    const sortedDays = Array.from(byDay.keys()).sort(
        (a, b) => b.localeCompare(a)
    );

    const selectedDays = sortedDays.slice(0, daysRequired);
    if (!selectedDays.length) return [];

    const result = [];
    selectedDays.forEach(d => result.push(...byDay.get(d)));

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