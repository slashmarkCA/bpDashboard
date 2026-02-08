/**
 * Updates the last reading date display in the header
 */
export function updateLastReadingDate() {
    const lastReadingEl = document.querySelector('.last-reading');
    if (!lastReadingEl) {
        console.warn('[LAST READING] Element .last-reading not found');
        return;
    }

    const data = window.NORMALIZED_BP_DATA || [];
    
    if (!data.length) {
        lastReadingEl.textContent = 'Last Reading Date: No data available';
        return;
    }

    // Get the most recent reading
    const newestReading = data.reduce((latest, current) => {
        return current.DateObj > latest.DateObj ? current : latest;
    });

    // Format the date (e.g., "February 6, 2026")
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = newestReading.DateObj.toLocaleDateString('en-US', options);
    
    lastReadingEl.textContent = `Last Reading Date: ${formattedDate}`;
    console.log('[LAST READING] Updated to:', formattedDate);
}

// Auto-run when module loads (after data normalization)
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure NORMALIZED_BP_DATA is ready
    setTimeout(updateLastReadingDate, 100);
});