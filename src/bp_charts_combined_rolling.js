/* ============================================================================
   bp_charts_combined_rolling.js
   ---------------------------------------------------------------------------
   Combined 7-Day Rolling Average (Sys + Dia)
   - Day-mean aggregation strategy
   - Standard deviation bands (toggleable)
   - Volume-based window (excludes gaps)
   ============================================================================ */

import { 
    destroyChart,
    formatTooltipDate, 
    formatAxisDate, 
    getLocalDateKey,
    getCssStyles
} from '../utils/bp_utils.js';

let combinedRollingChart = null;
const cssStyle = getCssStyles("light", "chart"); // call in some css styles from styles.css via bp_utils.js
let currentBandMode = 'none';
let cachedFilteredData = [];          // holds last-known data for the toggle

/**
 * Creates/updates the combined rolling average chart
 * @param {Array} filteredData - Filtered BP data
 */
export function createCombinedRollingChart(filteredData) {
    const ctx = document.getElementById('combinedRollingChart');
    if (!ctx) {
        console.error('[COMBINED ROLLING] Canvas element #combinedRollingChart not found');
        return;
    }

    // Destroy existing instance
    combinedRollingChart = destroyChart(combinedRollingChart);

    // Handle empty data
    if (!filteredData?.length) {
        console.warn('[COMBINED ROLLING] No data available');
        return;
    }

    // Cache so the toggle function can re-invoke us without needing the filter module
    cachedFilteredData = filteredData;

    // Access global data for lookback window
    const allData = [...window.NORMALIZED_BP_DATA].sort((a, b) => a.DateObj - b.DateObj);
    const sortedFiltered = [...filteredData].sort((a, b) => a.DateObj - b.DateObj);

    // Collapse all readings into daily means
    const dailyMap = allData.reduce((acc, r) => {
        const key = getLocalDateKey(r.DateObj);
        if (!acc[key]) acc[key] = { sys: [], dia: [], date: r.DateObj };
        acc[key].sys.push(r.Sys);
        acc[key].dia.push(r.Dia);
        return acc;
    }, {});

    const dailySeries = Object.keys(dailyMap).sort().map(key => ({
        key: key,
        date: dailyMap[key].date,
        avgSys: dailyMap[key].sys.reduce((a, b) => a + b, 0) / dailyMap[key].sys.length,
        avgDia: dailyMap[key].dia.reduce((a, b) => a + b, 0) / dailyMap[key].dia.length,
        rawCount: dailyMap[key].sys.length
    }));

    // Calculate rolling stats for visible readings
    const stats = sortedFiltered.map((r) => {
        const rKey = getLocalDateKey(r.DateObj);
        const dayIndex = dailySeries.findIndex(d => d.key === rKey);
        
        // Volume window: last 7 unique data-days
        const windowDays = dailySeries.slice(Math.max(0, dayIndex - 6), dayIndex + 1);

        const sysMeans = windowDays.map(d => d.avgSys);
        const diaMeans = windowDays.map(d => d.avgDia);

        const getMean = (vals) => vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        const getSD = (vals, mean) => {
            if (vals.length < 2) return 0;
            return Math.sqrt(vals.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / vals.length);
        };

        const sMean = getMean(sysMeans);
        const dMean = getMean(diaMeans);
        const sSD = getSD(sysMeans, sMean);
        const dSD = getSD(diaMeans, dMean);

        return {
            label: formatAxisDate(r.DateObj),
            fullDate: r.DateObj,
            sysAvg: sMean,
            diaAvg: dMean,
            sysUpper: sMean + sSD,
            sysLower: sMean - sSD,
            diaUpper: dMean + dSD,
            diaLower: dMean - dSD,
            dayCount: windowDays.length,
            readingCount: windowDays.reduce((sum, d) => sum + d.rawCount, 0)
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
                    pointRadius: 1.5,
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
                    pointRadius: 1.5,
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
                            return `\nWindow: ${point.dayCount} Days\nReadings: ${point.readingCount}`;
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
                        font: {
                            weight: cssStyle.weight, 
                            size: cssStyle.size, 
                            family: cssStyle.family,
                        },
                        color: cssStyle.color,
                    },
                    grid: { display: false }
                },
                y: { 
                    suggestedMin: 60, 
                    suggestedMax: 160, 
                    ticks:{
                        font: {
                            weight: cssStyle.weight, 
                            size: cssStyle.size, 
                            family: cssStyle.family,
                        },
                        color: cssStyle.color,
                    },
                }
            }
        }
    });
    
    console.log('[Trace] bp_charts_combined_rolling.js rendered successfully');
}

/**
 * Toggle standard deviation bands.
 * Called by HTML radio buttons: onchange="toggleCombinedStdDevBand('systolic')"
 * Must live on window because it's invoked from an inline onchange attribute.
 * @param {string} mode - 'systolic' | 'diastolic' | 'none'
 */
window.toggleCombinedStdDevBand = function(mode) {
    currentBandMode = mode;
    if (cachedFilteredData.length > 0) {
        createCombinedRollingChart(cachedFilteredData);
    }
};