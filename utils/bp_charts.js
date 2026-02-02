/* ============================================================================
   bp_charts.js
   ---------------------------------------------------------------------------
   Central chart dispatcher with error boundaries
   - Registers all chart creation functions
   - Manages chart lifecycle
   - Provides fallback error handling
   ============================================================================ */

// Register all chart modules
import { create5ColAggregateSummary } from '../src/bp_5colAggregateSummary_cards.js';
import { createMAP7DayChart } from '../src/bp_7dayAvg_combined_map_line.js';
import { createCategoryChart } from '../src/bp_categoryOverTime.js';
import { createCombinedRollingChart } from '../src/bp_charts_combined_rolling.js';
import { createSysAndDiaChart } from '../src/bp_charts_line.js';
import { createScatterChart } from '../src/bp_charts_scatter.js';
import { createHeatmap } from '../src/bp_heatmap.js';
import { createPulseHistogramChart } from '../src/bp_pulse_histogram.js';
import { createPulseLineChart } from '../src/bp_pulse_line.js';
import { createPulsePressureHistogram } from '../src/bp_pulsePressure_histogram.js';
import { createPulsePressureLineChart } from '../src/bp_pulsePressure_line.js';
import { renderRawBPTable } from '../src/bp_rawDataTabularView.js';
import { createBoxWhiskerChart } from '../src/bp_SysDia_volatilityBoxAndWhisker.js';
import { createNormalDonutCard } from '../src/filteredNormalDonutCard.js';
import { renderReadingCategoriesSummary } from '../src/readingCategoriesSummaryCard.js';
import { createReadingsInDays } from '../src/ReadingsInDaysCard.js';

/**
 * Chart registry with error isolation
 * Each chart is wrapped in a try-catch to prevent cascade failures
 */
const CHART_REGISTRY = [
    { name: 'Readings/Days Badge', fn: createReadingsInDays },
    { name: '5-Col Summary Cards', fn: create5ColAggregateSummary },
    { name: 'Heatmap', fn: createHeatmap },
    { name: 'Category Summary Card', fn: renderReadingCategoriesSummary },
    { name: 'Normal Donut Card', fn: createNormalDonutCard },
    { name: 'Category Over Time', fn: createCategoryChart },
    { name: 'Scatter Chart', fn: createScatterChart },
    { name: 'Pulse Line Chart', fn: createPulseLineChart },
    { name: 'Pulse Histogram', fn: createPulseHistogramChart },
    { name: 'Pulse Pressure Line', fn: createPulsePressureLineChart },
    { name: 'Pulse Pressure Histogram', fn: createPulsePressureHistogram },
    { name: 'Sys/Dia Line Chart', fn: createSysAndDiaChart },
    { name: 'Box & Whisker', fn: createBoxWhiskerChart },
    { name: 'Combined Rolling Chart', fn: createCombinedRollingChart },
    { name: 'MAP 7-Day Chart', fn: createMAP7DayChart },
    { name: 'Raw Data Table', fn: renderRawBPTable }
];

/**
 * Main dispatcher function
 * Orchestrates creation of all dashboard charts with error isolation
 * @param {Array} filteredData - The array of normalized records for the selected range
 */
export function createAllCharts(filteredData) {
    console.log('[DISPATCHER] Starting chart update cycle');
    
    // 1. Dependency check - ensure Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('[DISPATCHER] Chart.js library not loaded');
        if (typeof showGlobalErrorBanner === 'function') {
            showGlobalErrorBanner('Charts library failed to load. Please refresh the page.');
        }
        return;
    }

    // 2. Handle empty data scenario
    if (!filteredData || filteredData.length === 0) {
        console.warn('[DISPATCHER] No data available for rendering');
        
        // Still render charts - they'll show empty states
        CHART_REGISTRY.forEach(({ name, fn }) => {
            try {
                fn([]);
            } catch (err) {
                console.error(`[DISPATCHER] ${name} failed on empty data:`, err);
            }
        });
        
        return;
    }

    // 3. Render all charts with isolated error handling
    let successCount = 0;
    let errorCount = 0;
    
    CHART_REGISTRY.forEach(({ name, fn }) => {
        try {
            fn(filteredData);
            successCount++;
        } catch (err) {
            errorCount++;
            console.error(`[DISPATCHER] Failed to render ${name}:`, err);
            
            // Don't let one chart failure break the entire dashboard
            // User will see empty space where chart should be
        }
    });

    console.log(`[DISPATCHER] Update complete: ${successCount} succeeded, ${errorCount} failed`);
    
    // Show error banner only if multiple charts failed
    if (errorCount > 3 && typeof showGlobalErrorBanner === 'function') {
        showGlobalErrorBanner(`${errorCount} charts failed to render. Some visualizations may be unavailable.`);
    }
}

// Export for external use (backwards compatibility) TODO: How do I get rid of this?
// Note: Prefer importing createAllCharts directly
window.updateAllCharts = createAllCharts;