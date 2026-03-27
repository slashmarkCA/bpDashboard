/**
 * lastReadingDate.js
 * Updates the "Last Reading Date" span in the header.
 * Called by main.js after normalization is complete.
 * Reads from window.NORMALIZED_BP_DATA which is set as a side-effect of normalizeData().
 */
export function updateLastReadingDate() {

    // Target the <span id="last-reading-date"> inside the header paragraph,
    // not the <p class="last-reading"> itself — avoids overwriting the label text.
    const lastReadingEl = document.getElementById('last-reading-date');
    if (!lastReadingEl) {
        console.warn('[LAST READING] Element #last-reading-date not found');
        return;
    }

    const data = window.NORMALIZED_BP_DATA || [];

    if (!data.length) {
        lastReadingEl.textContent = 'No data available';
        return;
    }

    // Find the most recent reading by comparing DateObj values
    const newestReading = data.reduce((latest, current) => {
        return current.DateObj > latest.DateObj ? current : latest;
    });

    // Format as "February 6, 2026"
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = newestReading.DateObj.toLocaleDateString('en-US', options);

    lastReadingEl.textContent = formattedDate;
    console.log('[LAST READING] Updated to:', formattedDate);
}