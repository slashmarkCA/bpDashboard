
    import { updateHeatmap } from '../src/bp_heatmap.js';

    function updateAllCharts(filteredData) {
    
    // SCENARIO: Library failed to load
    // We check this first so we don't even try to run chart logic
    if (!checkChartDependencies()) return;    
    
        // SCENARIO: No data for the selected period
    if (!filteredData || filteredData.length === 0) {
        // 1. Summary cards handle themselves (we built the '--' reset already)
        update5ColAggregateSummary([]);
        updateReadingsInDays([]);
        
        // 2. Clear charts and show a "No Data" message instead of empty axes
        showChartError("No readings found for the selected date range.");
        return;
    }

    // Normal execution if all is well
        updateSysAndDiaChart(filteredData);
        updateScatterChart(filteredData);
        updatePulseLineChart(filteredData);
        updatePulseHistogramChart(filteredData);
        updatePulsePressureHistogram(filteredData);
        updatePulsePressureLineChart(filteredData);
        updateCategoryChart(filteredData);
        updateCombinedRollingChart(filteredData);
        updateMAP7DayChart(filteredData);
        updateReadingCategoriesSummaryCard(filteredData);
        updateNormalDonutCard(filteredData);
        updateReadingsInDays(filteredData)
        updatePeriodAggregateSummaryCard(filteredData);
        update5ColAggregateSummary(filteredData);
        updateBoxWhiskerChart(filteredData)
        updateHeatmap(filteredData); 
}

window.updateAllCharts = updateAllCharts;