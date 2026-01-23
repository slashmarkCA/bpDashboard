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
        updateReadingsInDaysCard(filteredData);
        updatePeriodAggregateSummaryCard(filteredData);
        updateSysDiaVolatilityChart(filteredData)
    }