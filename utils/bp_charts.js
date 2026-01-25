    function updateAllCharts(filteredData) {
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
    }