/* ============================================================================
   bp_charts_combined_rolling.js - CALENDAR-ALIGNED RAW DATA (FINAL)
   ============================================================================ */

console.log('bp_charts_combined_rolling.js (Calendar-Aligned Mode) loaded');

let combinedRollingChart = null;
let currentBandMode = 'none';

function createCombinedRollingChart(filteredData) {
    const ctx = document.getElementById('combinedRollingChart');
    if (!ctx) return;
    if (combinedRollingChart) combinedRollingChart.destroy();

    if (!filteredData || filteredData.length === 0) return;

    // 1. ACCESS GLOBAL DATA for historical lookback
    const allData = [...window.NORMALIZED_BP_DATA].sort((a, b) => a.DateObj - b.DateObj);
    const sortedFiltered = [...filteredData].sort((a, b) => a.DateObj - b.DateObj);

    // 2. Calculate rolling stats using CALENDAR DAYS
    const stats = sortedFiltered.map((r) => {
        // Create a window from Midnight 6 days ago to Midnight of the reading date
        const d = r.DateObj;
        const windowStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 6, 0, 0, 0);
        const windowEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

        const windowReadings = allData.filter(d =>
            d.DateObj >= windowStart && d.DateObj <= windowEnd
        );

        const sysVals = windowReadings.map(d => d.Sys);
        const diaVals = windowReadings.map(d => d.Dia);

        const getMean = (vals) => vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        const getSD = (vals, mean) => {
            if (vals.length < 2) return 0;
            return Math.sqrt(vals.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / vals.length);
        };

        const sMean = getMean(sysVals);
        const dMean = getMean(diaVals);
        const sSD = getSD(sysVals, sMean);
        const dSD = getSD(diaVals, dMean);

        return {
            label: formatAxisDate(r.DateObj),
            fullDate: r.DateObj,
            sysAvg: sMean,
            diaAvg: dMean,
            sysUpper: sMean + sSD,
            sysLower: sMean - sSD,
            diaUpper: dMean + dSD,
            diaLower: dMean - dSD,
            windowCount: windowReadings.length,
            windowRange: `${formatAxisDate(windowStart)} to ${formatAxisDate(windowEnd)}`
        };
    });

    combinedRollingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: stats.map(s => s.label),
            datasets: [
                {
                    label: '7-Day Sys Avg',
                    data: stats.map(s => s.sysAvg),
                    borderColor: '#d32f2f',
                    borderWidth: 2,
                    pointRadius: 2,
                    tension: 0.3,
                    fill: false,
                    zIndex: 10
                },
                {
                    label: 'Sys +1SD',
                    data: stats.map(s => s.sysUpper),
                    borderColor: 'transparent',
                    pointRadius: 0,
                    fill: false,
                    hidden: currentBandMode !== 'systolic'
                },
                {
                    label: 'Sys -1SD',
                    data: stats.map(s => s.sysLower),
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(211, 47, 47, 0.15)',
                    pointRadius: 0,
                    fill: '-1',
                    hidden: currentBandMode !== 'systolic'
                },
                {
                    label: '7-Day Dia Avg',
                    data: stats.map(s => s.diaAvg),
                    borderColor: '#1976d2',
                    borderWidth: 2,
                    pointRadius: 2,
                    tension: 0.3,
                    fill: false,
                    zIndex: 10
                },
                {
                    label: 'Dia +1SD',
                    data: stats.map(s => s.diaUpper),
                    borderColor: 'transparent',
                    pointRadius: 0,
                    fill: false,
                    hidden: currentBandMode !== 'diastolic'
                },
                {
                    label: 'Dia -1SD',
                    data: stats.map(s => s.diaLower),
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(25, 118, 210, 0.15)',
                    pointRadius: 0,
                    fill: '-1',
                    hidden: currentBandMode !== 'diastolic'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { filter: item => !item.text.includes('SD') }
                },
                tooltip: {
                    callbacks: {
                        title: (items) => formatTooltipDate(stats[items[0].dataIndex].fullDate),
                        afterBody: (items) => {
                            const point = stats[items[0].dataIndex];
                            return `\nWindow: ${point.windowCount} readings\nRange: ${point.windowRange}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 90,
                        minRotation: 90,
                        autoSkip: true,
                        maxTicksLimit: 20,
                        font: { size: 10 }
                    }
                },
                y: { suggestedMin: 60, suggestedMax: 160 }
            }
        }
    });
}

/**
 * RESTORED EXPORT FUNCTIONS
 */
function toggleCombinedStdDevBand(mode) {
    currentBandMode = mode;
    // Refresh with current filter
    if (typeof getFilteredBPData === 'function' && typeof getCurrentFilter === 'function') {
        createCombinedRollingChart(getFilteredBPData(getCurrentFilter()));
    }
}

function updateCombinedRollingChart(filteredData) {
    createCombinedRollingChart(filteredData);
}