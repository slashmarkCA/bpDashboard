/* ============================================================================
   bp_charts_line.js
   ---------------------------------------------------------------------------
   Systolic & Diastolic Line Chart
   - Standardized lifecycle management
   - Linear regression trendlines
   - Dynamic date ticks
   - Custom tooltip content
   ============================================================================ */

import { 
    destroyChart,
    linearRegression, 
    formatTooltipDate, 
    formatAxisDate,
    getCssStyles
} from '../utils/bp_utils.js';

let sysAndDiaChart = null;
const cssStyle = getCssStyles("light", "chart"); // call in some css styles from styles.css via bp_utils.js

/**
 * Creates/updates the Sys/Dia line chart
 * @param {Array} bpData - Filtered BP data
 */

export function createSysAndDiaChart(bpData) {
    const canvas = document.getElementById('sysAndDiaChart');
    if (!canvas) {
        console.error('[SYS/DIA CHART] Canvas element #sysAndDiaChart not found');
        return;
    }

    // Destroy existing instance
    sysAndDiaChart = destroyChart(sysAndDiaChart);

    // Handle empty data
    if (!bpData?.length) {
        console.warn('[SYS/DIA CHART] No data available');
        return;
    }

    const ctx = canvas.getContext('2d');
    const sysData = bpData.map((r, i) => ({ x: i, y: r.Sys, reading: r }));
    const diaData = bpData.map((r, i) => ({ x: i, y: r.Dia, reading: r }));

    // Calculate trendlines using utility function
    const sysTrend = linearRegression(sysData);
    const diaTrend = linearRegression(diaData);

    sysAndDiaChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Systolic',
                    data: sysData,
                    borderColor: '#2D434E',
                    backgroundColor: '#2D434E',
                    borderWidth: 1.5,
                    pointRadius: 1.5,
                    pointHoverRadius: 5,
                    tension: 0.2,
                    order: 1
                },
                {
                    label: 'Diastolic',
                    data: diaData,
                    borderColor: '#6aafd2',
                    backgroundColor: '#6aafd2',
                    borderWidth: 1.5,
                    pointRadius: 1.5,
                    pointHoverRadius: 5,
                    tension: 0.2,
                    order: 2
                },
                // Systolic trendline
                {
                    data: sysTrend,
                    borderColor: '#1a2a33',
                    borderDash: [6, 6],
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0,
                    order: 3
                },
                // Diastolic trendline
                {
                    data: diaTrend,
                    borderColor: '#3d6a85',
                    borderDash: [6, 6],
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0,
                    order: 4
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
                legend: {
                    display: true,
                    labels: {
                        // Hide trendlines from legend
                        filter: item => item.text,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 4,
                        boxHeight: 4,
                        padding: 15
                    }
                },                
                tooltip: {
                    callbacks: {
                        title: () => '',
                        label(context) {
                            // Skip tooltips for trendlines
                            if (!context.raw.reading) return null;

                            const r = context.raw.reading;
                            const prefix = context.dataset.label === 'Systolic' ? 'Sys' : 'Dia';

                            return [
                                `${prefix}: ${context.raw.y}`,
                                '',
                                `Date: ${formatTooltipDate(r.DateObj)}`,
                                `Comments: ${r.FormComments || ''}`,
                                `ReadingID: ${r.ReadingID}`
                            ];
                        }
                    },
                    displayColors: false,
                    // Filter out trendline tooltips completely
                    filter: (tooltipItem) => tooltipItem.raw.reading !== undefined
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: bpData.length - 1,
                    ticks: {
                        callback(value) {
                            const i = Math.round(value);
                            if (i !== value || !bpData[i]) return '';

                            const total = bpData.length;
                            let skip = 1;
                            if (total > 100) skip = 10;
                            else if (total > 50) skip = 5;
                            else if (total > 20) skip = 2;

                            return i % skip === 0 ? formatAxisDate(bpData[i].DateObj) : '';
                        },
                        font: {
                            weight: cssStyle.weight, 
                            size: cssStyle.size, 
                            family: cssStyle.family,
                        },
                        color: cssStyle.color,
                        maxRotation: 90,
                        minRotation: 90,
                        autoSkip: false,
                    },
                    grid: { display: false }
                },
                y: {
                    grid: { color: '#f0f0f0' },
                    ticks: {
                        font: {
                            weight: cssStyle.weight, 
                            size: cssStyle.size, 
                            family: cssStyle.family,
                        },
                        color: cssStyle.color,
                    }
                }
            }
        }
    });
    console.log(bpData);
    console.log(bpData.DateObj)
    console.log('[Trace] bp_charts_line.js rendered successfully');
}