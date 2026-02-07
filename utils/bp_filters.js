/* ============================================================================
   bp_filters.js
   ---------------------------------------------------------------------------
   Centralized date filtering logic
   CONTRACT:
   - Calendar-day based filtering
   - Last N days WITH readings (no empty-day padding)
   - Include ALL readings within each included day
   - Return [] if no data in range
   - NO window object pollution
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

    // "All" filter - return everything sorted
    if (range === 'all') {
        return [...SOURCE_DATA].sort((a, b) => a.DateObj - b.DateObj);
    }

    // Determine number of days required
    const daysRequired = {
        last7days: 7,
        last14days: 14,
        last30days: 30
    }[range];

    if (!daysRequired) {
        console.error(`[FILTER] Unknown range: ${range}`);
        return SOURCE_DATA;
    }

    // 1. Group all available data by local date key
    const byDay = new Map();
    SOURCE_DATA.forEach(r => {
        const key = getLocalDateKey(r.DateObj);
        if (!key) {
            console.warn('[FILTER] Skipping record with invalid date:', r.ReadingID);
            return;
        }
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key).push(r);
    });

    // 2. Sort unique dates newest to oldest
    const sortedDays = Array.from(byDay.keys()).sort((a, b) => b.localeCompare(a));

    // 3. Take the N most recent days that actually have readings
    const selectedDays = sortedDays.slice(0, daysRequired);

    if (!selectedDays.length) {
        console.warn(`[FILTER] No days found for range: ${range}`);
        return [];
    }

    // 4. Flatten the readings from those selected days back into a single array
    const result = [];
    selectedDays.forEach(dayKey => {
        result.push(...byDay.get(dayKey));
    });

    // 5. Return sorted oldest to newest for Chart.js
    return result.sort((a, b) => a.DateObj - b.DateObj);
}

/**
 * UI event handler with error boundaries
 * @param {Array} filteredData - Filtered dataset
 */
function updateAllCharts(filteredData) {
    try {
        if (!filteredData.length) {
            console.warn('[FILTER] No data for current filter, showing empty state');
        }
        
        createAllCharts(filteredData);
        
        console.log(
            `[FILTER] ${currentFilter}`,
            `Days: ${new Set(filteredData.map(r => getLocalDateKey(r.DateObj))).size}`,
            `Readings: ${filteredData.length}`
        );
    } catch (error) {
        console.error('[FILTER] Error updating charts:', error);
        if (typeof showGlobalErrorBanner === 'function') {
            showGlobalErrorBanner('Failed to update charts. Please refresh the page.');
        }
    }
}

/**
 * Initialize filter buttons and render initial charts
 */
function initializeFilters() {
    const buttons = document.querySelectorAll('.date-pill');

    if (!buttons.length) {
        console.error('[FILTER] No filter buttons found in DOM');
        return;
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update UI state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update filter
            currentFilter = btn.dataset.filter || 'last7days';

            // Get filtered data
            const filtered = getFilteredBPData(currentFilter);

            // Update charts
            updateAllCharts(filtered);
        });
    });

    // Initial render
    console.log('[FILTER] Initializing dashboard with default filter:', currentFilter);
    const initial = getFilteredBPData(currentFilter);
    updateAllCharts(initial);
}

/**
 * Wait for both DOM and data to be ready before initializing
 */
let domReady = false;
let dataReady = false;

function checkAndInitialize() {
    if (domReady && dataReady) {
        console.log('[FILTER] ✅ DOM and data both ready, initializing filters...');
        initializeFilters();
    }
}

// Listen for DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[FILTER] DOM loaded, waiting for data...');
    domReady = true;
    checkAndInitialize();
});

// Listen for data ready (fired by bp_data_normalized.js after normalization completes)
window.addEventListener('bpDataLoaded', () => {
    console.log('[FILTER] Data load event received, waiting for normalization...');
    
    // Small delay to ensure NORMALIZED_BP_DATA is fully set
    setTimeout(() => {
        dataReady = true;
        checkAndInitialize();
    }, 100);
});