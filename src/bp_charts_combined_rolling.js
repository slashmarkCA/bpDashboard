/* ============================================================================
    bp_charts_combined_rolling.js - DAY-MEAN AGGREGATION MODE (FINAL)
    STRATEGY: 
    1. Collapse multi-reading days into a single Daily Mean.
    2. Slide a window across the last 7 AVAILABLE days of data.
    3. Exclude gaps (Denominator = count of days with data).
    ============================================================================ */

import { linearRegression, destroyChart, formatTooltipDate, formatAxisDate, getLocalDateKey, calculateMAP } from '../utils/bp_utils.js';

console.log('bp_charts_combined_rolling.js (Day-Mean Mode) loaded');

let combinedRollingChart = null;
let currentBandMode = 'none';

function createCombinedRollingChart(filteredData) {
    const ctx = document.getElementById('combinedRollingChart');
    if (!ctx) return;
    if (combinedRollingChart) combinedRollingChart.destroy();

    if (!filteredData || filteredData.length === 0) return;

    // 1. ACCESS GLOBAL DATA
    // We need allData to ensure the "Lookback" isn't cut off by the UI filter
    const allData = [...window.NORMALIZED_BP_DATA].sort((a, b) => a.DateObj - b.DateObj);
    const sortedFiltered = [...filteredData].sort((a, b) => a.DateObj - b.DateObj);

    // 2. PRE-PROCESS: Collapse all global readings into Daily Means
    // This prevents "Averages of Averages" bias on multi-reading days.
    const dailyMap = allData.reduce((acc, r) => {
        const key = getLocalDateKey(r.DateObj);
        if (!acc[key]) acc[key] = { sys: [], dia: [], date: r.DateObj };
        acc[key].sys.push(r.Sys);
        acc[key].dia.push(r.Dia);
        return acc;
    }, {});

    // Convert map to sorted array of points (One point per day)
    const dailySeries = Object.keys(dailyMap).sort().map(key => ({
        key: key,
        date: dailyMap[key].date,
        avgSys: dailyMap[key].sys.reduce((a, b) => a + b, 0) / dailyMap[key].sys.length,
        avgDia: dailyMap[key].dia.reduce((a, b) => a + b, 0) / dailyMap[key].dia.length,
        rawCount: dailyMap[key].sys.length
    }));

    // 3. CALCULATE STATS: Loop through the visible readings
    const stats = sortedFiltered.map((r) => {
        const rKey = getLocalDateKey(r.DateObj);
        const dayIndex = dailySeries.findIndex(d => d.key === rKey);
        
        // VOLUME WINDOW: Take the last 7 unique data-days leading up to this reading
        // This is the "Exclusionary" null handling (Denominator = days with data)
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
            // Total readings inside those 7 days
            readingCount: windowDays.reduce((sum, d) => sum + d.rawCount, 0)
        };
    });

    combinedRollingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: stats.map(s => s.label),
            datasets: [
                {
                    label: '7-Day Sys Avg (Day-Mean)',
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
                    label: '7-Day Dia Avg (Day-Mean)',
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
                            return `\nWindow: ${point.dayCount} Days with data\nTotal Readings: ${point.readingCount}`;
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

function toggleCombinedStdDevBand(mode) {
    currentBandMode = mode;
    if (typeof getFilteredBPData === 'function' && typeof getCurrentFilter === 'function') {
        createCombinedRollingChart(getFilteredBPData(getCurrentFilter()));
    }
}

function updateCombinedRollingChart(filteredData) {
    createCombinedRollingChart(filteredData);
}

window.updateCombinedRollingChart = updateCombinedRollingChart;