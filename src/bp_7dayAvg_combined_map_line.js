/* ============================================================================
   bp_7dayAvg_combined_map_line.js
   ---------------------------------------------------------------------------
   Mean Arterial Pressure (MAP) Chart
   - Daily MAP calculated from Sys + Dia
   - True 7-day rolling average with full lookback
   - Uses global dataset for accurate rolling window
   ============================================================================ */

import { 
    destroyChart,
    formatTooltipDate, 
    formatAxisDate, 
    getLocalDateKey, 
    calculateMAP 
} from '../utils/bp_utils.js';

let map7DayChart = null;

/**
 * Builds daily MAP values
 * @param {Array} bpData - BP readings
 * @returns {Array} Daily MAP aggregates
 */
function buildDailyMAP(bpData) {
    const byDay = new Map();

    bpData.forEach(r => {
        if (r.Sys == null || r.Dia == null || !(r.DateObj instanceof Date)) return;

        const d = new Date(
            r.DateObj.getFullYear(),
            r.DateObj.getMonth(),
            r.DateObj.getDate()
        );

        const key = d.getTime();
        const mapVal = calculateMAP(r.Sys, r.Dia);

        if (!byDay.has(key)) {
            byDay.set(key, { date: d, values: [] });
        }
        byDay.get(key).values.push(mapVal);
    });

    return Array.from(byDay.values())
        .map(d => ({
            date: d.date,
            map: d.values.reduce((a,b) => a + b, 0) / d.values.length
        }))
        .sort((a,b) => a.date - b.date);
}

/**
 * Builds 7-day rolling MAP average
 * @param {Array} dailyMAP - Daily MAP values
 * @returns {Array} Rolling averages
 */
function buildRolling7DayMAP(dailyMAP) {
    return dailyMAP.map(point => {
        const windowStart = new Date(point.date.getTime() - 6 * 86400000);

        const windowValues = dailyMAP
            .filter(p => p.date >= windowStart && p.date <= point.date)
            .map(p => p.map);

        const avg = windowValues.reduce((a,b) => a + b, 0) / windowValues.length;

        return {
            date: point.date,
            map: avg,
            windowDays: windowValues.length
        };
    });
}

/**
 * Creates/updates the MAP 7-day chart
 * @param {Array} bpData - Filtered BP data
 */
export function createMAP7DayChart(bpData) {
    const canvas = document.getElementById('map7DayChart');
    if (!canvas) {
        console.error('[MAP CHART] Canvas element #map7DayChart not found');
        return;
    }

    // Destroy existing instance
    map7DayChart = destroyChart(map7DayChart);

    // Handle empty data
    if (!bpData?.length) {
        console.warn('[MAP CHART] No data available');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Use full dataset for accurate rolling calculation
    const fullData = window.NORMALIZED_BP_DATA || [];
    const allDailyMAP = buildDailyMAP(fullData);
    const allRollingMAP = buildRolling7DayMAP(allDailyMAP);

    // Filter to visible date range
    const filteredDateKeys = new Set(
        bpData.map(r => new Date(
            r.DateObj.getFullYear(),
            r.DateObj.getMonth(),
            r.DateObj.getDate()
        ).getTime())
    );

    const dailyMAP = allDailyMAP.filter(d => filteredDateKeys.has(d.date.getTime()));
    const rollingMAP = allRollingMAP.filter(d => filteredDateKeys.has(d.date.getTime()));

    if (!dailyMAP.length) {
        console.warn('[MAP CHART] No daily MAP data after filtering');
        return;
    }

    const dailyData = dailyMAP.map((d, i) => ({
        x: i,
        y: d.map,
        readingDate: d.date
    }));

    const rollingData = rollingMAP.map((d, i) => ({
        x: i,
        y: d.map,
        readingDate: d.date,
        windowDays: d.windowDays
    }));

    map7DayChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Daily MAP',
                    data: dailyData,
                    borderColor: '#4E79A7',
                    backgroundColor: '#4E79A7',
                    borderWidth: 1.5,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.2
                },
                {
                    label: '7-Day Rolling MAP',
                    data: rollingData,
                    borderColor: '#F28E2B',
                    backgroundColor: '#F28E2B',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.25
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                intersect: true
            },
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        title: () => '',
                        label(ctx) {
                            const d = ctx.raw;
                            const prefix = ctx.dataset.label === 'Daily MAP' ? 'MAP' : '7-Day MAP';

                            const lines = [
                                `${prefix}: ${d.y.toFixed(1)}`,
                                `Date: ${formatTooltipDate(d.readingDate)}`
                            ];

                            if (d.windowDays !== undefined) {
                                lines.push(`Window: ${d.windowDays} days`);
                            }

                            return lines;
                        }
                    },
                    displayColors: false
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: dailyMAP.length - 1,
                    ticks: {
                        callback(value) {
                            const i = Math.round(value);
                            if (!dailyMAP[i]) return '';

                            const total = dailyMAP.length;
                            let skip = 1;
                            if (total > 100) skip = 10;
                            else if (total > 50) skip = 5;
                            else if (total > 20) skip = 2;

                            return i % skip === 0 ? formatAxisDate(dailyMAP[i].date) : '';
                        },
                        maxRotation: 90,
                        minRotation: 90,
                        autoSkip: false,
                        font: { size: 10 }
                    },
                    grid: { display: false }
                },
                y: {
                    grid: { color: '#f0f0f0' },
                    title: {
                        display: true,
                        text: 'Mean Arterial Pressure (MAP)'
                    }
                }
            }
        }
    });
    
    console.log('[Trace] bp_7dayAvg_combined_map_line.js rendered successfully');
}