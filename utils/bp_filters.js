/* ============================================================================
   bp_filters.js
   ---------------------------------------------------------------------------
   Centralized date filtering logic
   CONTRACT:
   - Calendar-day based filtering
   - Last N days WITH readings (no empty-day padding)
   - Include ALL readings within each included day
   - Return [] if no data in range
   ============================================================================ */

import { getLocalDateKey } from './bp_utils.js';
import { createAllCharts } from './bp_charts.js';

let currentFilter = 'last7days';

/**
 * Canonical data source
 * Safely accesses normalized data with fallback
 */
const getSourceData = () => {
    const data = Array.isArray(window.NORMALIZED_BP_DATA) 
        ? window.NORMALIZED_BP_DATA 
        : [];
    
    if (!data.length) {
        console.warn('[FILTER] No normalized BP data available');
    }
    
    return data;
};

/**
 * Public accessor for current filter state
 * @returns {string} Current filter name
 */
export function getCurrentFilter() {
    return currentFilter;
}

/**
 * Core filtering function - Volume-Based (Last N Days with Data)
 * Groups by day and slices the most recent "Data Days"
 * @param {string} range - Filter range identifier
 * @returns {Array} Filtered BP records
 */
export function getFilteredBPData(range) {
    const SOURCE_DATA = getSourceData();
    
    if (!SOURCE_DATA.length) {
        console.error('[FILTER] No source data available for filtering');
        return [];
    }

    if (range === 'all') {
        return [...SOURCE_DATA].sort((a, b) => a.DateObj - b.DateObj);
    }

    const daysRequired = {
        last7days: 7,
        last14days: 14,
        last30days: 30
    }[range];

    if (!daysRequired) {
        console.error(`[FILTER] Unknown range: ${range}`);
        return SOURCE_DATA;
    }

    const byDay = new Map();
    SOURCE_DATA.forEach(r => {
        const key = getLocalDateKey(r.DateObj);
        if (!key) return;
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key).push(r);
    });

    const sortedDays = Array.from(byDay.keys()).sort((a, b) => b.localeCompare(a));
    const selectedDays = sortedDays.slice(0, daysRequired);

    if (!selectedDays.length) return [];

    const result = [];
    selectedDays.forEach(dayKey => {
        result.push(...byDay.get(dayKey));
    });

    return result.sort((a, b) => a.DateObj - b.DateObj);
}

/**
 * UI event handler with error boundaries
 */
function updateAllCharts(filteredData) {
    try {
        createAllCharts(filteredData);
        console.log(`[FILTER] Rendered ${currentFilter}: ${filteredData.length} readings`);
    } catch (error) {
        console.error('[FILTER] Error updating charts:', error);
        if (typeof showGlobalErrorBanner === 'function') {
            showGlobalErrorBanner('Failed to update charts. Please refresh the page.');
        }
    }
}

/**
 * Initialize filter buttons and render initial charts
 * Exported to be called by main.js
 * @param {Array} normalizedData - The fully processed data array
 */
export function initializeFilters(normalizedData) {
    const buttons = document.querySelectorAll('.date-pill');
    if (!buttons.length) {
        console.error('[FILTER] No filter buttons found in DOM');
        return;
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentFilter = btn.dataset.filter || 'last7days';
            const filtered = getFilteredBPData(currentFilter);
            updateAllCharts(filtered);
        });
    });

    // Initial render call
    console.log('[FILTER] Initializing dashboard with default filter:', currentFilter);
    const initial = getFilteredBPData(currentFilter);
    updateAllCharts(initial);
}