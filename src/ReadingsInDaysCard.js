/* ============================================================================
   ReadingsInDaysCard.js
   ---------------------------------------------------------------------------
   Readings/Days Badge Card
   - Shows total readings count
   - Shows distinct calendar days with readings
   - Pure DOM manipulation (no Chart.js)
   - changed from .toISOString() to locale date to address UTC time defect for 
     └ reradings after -5 EST readings being grouped into the day after.
   ============================================================================ */

/**
 * Updates the readings and days badges
 * @param {Array} filteredData - Filtered BP data
 */
export function createReadingsInDays(filteredData) {
    const readingsEl = document.getElementById('total-readings');
    const daysEl = document.getElementById('total-days');

    // Safety check - ensure elements exist
    if (!readingsEl || !daysEl) {
        console.error('[READINGS/DAYS CARD] Badge elements not found');
        return;
    }

    // Handle empty data
    if (!filteredData || filteredData.length === 0) {
        readingsEl.innerText = '0';
        daysEl.innerText = '0';
        console.warn('[READINGS/DAYS CARD] No data available');
        return;
    }

    // Update Total Readings
    readingsEl.innerText = filteredData.length;

    // Update Total Days (distinct calendar days)
    // replaced return dateObj.toISOString().split('T')[0]; for ISO/UTC defect on line 41.
    const distinctDays = new Set(filteredData.map(d => {
        const dateObj = d.DateObj || new Date(d.Date);
        return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    })).size;

    daysEl.innerText = distinctDays;
    
    console.log('[Trace] ReadingsInDaysCard.js rendered successfully');
}