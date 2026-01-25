/* ============================================================================
   ReadingsInDaysCard.js
   ---------------------------------------------------------------------------
   Displays:
   - Number of filtered readings
   - Number of DISTINCT calendar days WITH readings (not span!)
   ============================================================================ */

console.log('ReadingsInDaysCard.js loaded');

/**
 * ReadingsInDaysCard.js (Lean Version)
 * Updates the 'Readings' and 'Days' badges in the 5-column summary.
 */
function updateReadingsInDays(filteredData) {
    const readingsEl = document.getElementById('total-readings');
    const daysEl = document.getElementById('total-days');

    // Safety: Ensure elements exist before trying to update
    if (!readingsEl || !daysEl) return;

    // Reset if no data
    if (!filteredData || filteredData.length === 0) {
        readingsEl.innerText = '0';
        daysEl.innerText = '0';
        return;
    }

    // 1. Update Total Readings (Count of the array)
    readingsEl.innerText = filteredData.length;

    // 2. Update Total Days (Distinct set of date strings)
    const distinctDays = new Set(filteredData.map(d => {
        // Ensure we handle the Date correctly regardless of data source
        const dateObj = d.DateObj || new Date(d.Date);
        return dateObj.toISOString().split('T')[0];
    })).size;

    daysEl.innerText = distinctDays;
}

// Global expose for the chart dispatcher
window.updateReadingsInDays = updateReadingsInDays;