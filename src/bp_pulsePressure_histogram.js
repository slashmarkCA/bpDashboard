/* ============================================================================
   bp_pulsePressure_histogram.js
   ---------------------------------------------------------------------------
   Pulse Pressure Distribution Histogram
   - Clinical zones: Narrowed/Normal/Widened/Very Widened
   - Percentage labels on bars
   - Horizontal gridlines
   ============================================================================ */

import { destroyChart, getCssStyles } from '../utils/bp_utils.js';

let pulsePressureHistogramChart = null;
const cssStyle = getCssStyles("light", "chart"); // call in some css styles from styles.css via bp_utils.js

/**
 * Builds histogram bins from pulse pressure data
 */
function buildPulsePressureHistogram(bpData, bucketSize = 5) {
    const buckets = {};
    const total = bpData.length;

    bpData.forEach(r => {
        // Calculate pulse pressure from raw measurements
        const val = (r.Sys != null && r.Dia != null) ? (Number(r.Sys) - Number(r.Dia)) : null;
        
        if (val === null || isNaN(val)) return;

        const start = Math.floor(val / bucketSize) * bucketSize;
        const end = start + bucketSize;
        const key = `${start}-${end}`;

        if (!buckets[key]) {
            buckets[key] = { start, end, count: 0 };
        }
        buckets[key].count++;
    });

    return Object.values(buckets)
        .filter(b => b.count > 0)
        .sort((a, b) => a.start - b.start)
        .map(b => ({
            ...b,
            percent: Math.round((b.count / total) * 100)
        }));
}

/**
 * Plugin to draw percentage labels on bars
 */
function pulsePressureLabelsPlugin(bins) {
    return {
        id: 'pulsePressureLabels',
        afterDatasetsDraw(chart) {
            const { ctx, scales } = chart;
            const meta = chart.getDatasetMeta(0);
            
            ctx.save();
            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            meta.data.forEach((bar, i) => {
                const b = bins[i];
                if (!b || !b.count) return;
                const label = `${b.count} (${b.percent}%)`;
                const y = Math.max(bar.y - 6, scales.y.top + 18);
                ctx.fillText(label, bar.x, y);
            });
            
            ctx.restore();
        }
    };
}

/**
 * Creates/updates the pulse pressure histogram
 * @param {Array} filteredData - Filtered BP data
 */
export function createPulsePressureHistogram(filteredData) {
    const canvas = document.getElementById('pulsePressureHistogram');
    if (!canvas) {
        console.error('[PP HISTOGRAM] Canvas element #pulsePressureHistogram not found');
        return;
    }

    // Destroy existing instance
    pulsePressureHistogramChart = destroyChart(pulsePressureHistogramChart);

    // Handle empty data
    if (!filteredData?.length) {
        console.warn('[PP HISTOGRAM] No data available');
        return;
    }

    const bins = buildPulsePressureHistogram(filteredData);
    if (!bins.length) {
        console.warn('[PP HISTOGRAM] No bins generated');
        return;
    }

    // Calculate zone boundary indices
    const getIdx = (val) => {
        const i = bins.findIndex(b => b.start >= val);
        return i === -1 ? bins.length - 0.5 : i - 0.5;
    };

    const idx40 = getIdx(40);
    const idx60 = getIdx(60);
    const idx100 = getIdx(100);
    const maxCount = Math.max(...bins.map(b => b.count), 1);

    pulsePressureHistogramChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: bins.map(b => `${b.start}-${b.end}`),
            datasets: [{
                data: bins.map(b => b.count),
                backgroundColor: '#2c3e50',
                borderRadius: 2,
                barPercentage: 0.8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true, 
                    max: Math.ceil(maxCount * 1.4), 
                    ticks: { display: false },
                    grid: { 
                        display: true,
                        color: '#eeeeee', 
                        drawTicks: false
                    } 
                },
                x: { 
                    ticks:{
                        font: {
                            weight: cssStyle.weight, 
                            size: cssStyle.size, 
                            family: cssStyle.family,
                        },
                        color: cssStyle.color,
                    },
                    grid: { display: false } 
                },
            },
            plugins: {
                legend: { display: false },
                annotation: {
                    annotations: {
                        narrowBox: {
                            type: 'box', xMin: -0.5, xMax: idx40,
                            backgroundColor: 'rgba(238,182,73,0.12)', borderWidth: 0,
                            label: { 
                                display: true, content: 'NARROWED', 
                                position: {x: 'start', y: 'start'}, 
                                xAdjust: 5, yAdjust: 12, 
                                font: {size: 10, weight: 'bold'}, 
                                color: 'rgba(0,0,0,0.4)' 
                            }
                        },
                        normalBox: {
                            type: 'box', xMin: idx40, xMax: idx60,
                            backgroundColor: 'rgba(32,73,41,0.10)', borderWidth: 0,
                            label: { 
                                display: true, content: 'NORMAL', 
                                position: {x: 'start', y: 'start'}, 
                                xAdjust: 5, yAdjust: 12, 
                                font: {size: 10, weight: 'bold'}, 
                                color: 'rgba(0,0,0,0.4)' 
                            }
                        },
                        wideBox: {
                            type: 'box', xMin: idx60, xMax: idx100,
                            backgroundColor: 'rgba(217,81,57,0.10)', borderWidth: 0,
                            label: { 
                                display: true, content: 'WIDENED', 
                                position: {x: 'start', y: 'start'}, 
                                xAdjust: 5, yAdjust: 12, 
                                font: {size: 10, weight: 'bold'}, 
                                color: 'rgba(0,0,0,0.4)' 
                            }
                        },
                        veryWideBox: {
                            type: 'box', xMin: idx100, xMax: bins.length - 0.5,
                            backgroundColor: 'rgba(173,50,45,0.12)', borderWidth: 0,
                            display: (idx100 < bins.length),
                            label: { 
                                display: true, content: 'VERY WIDE', 
                                position: {x: 'start', y: 'start'}, 
                                xAdjust: 5, yAdjust: 12, 
                                font: {size: 10, weight: 'bold'}, 
                                color: 'rgba(0,0,0,0.4)' 
                            }
                        },
                        line40: { type: 'line', xMin: idx40, xMax: idx40, borderColor: '#333', borderDash: [5, 5], borderWidth: 1 },
                        line60: { type: 'line', xMin: idx60, xMax: idx60, borderColor: '#333', borderDash: [5, 5], borderWidth: 1 },
                        line100: { type: 'line', xMin: idx100, xMax: idx100, borderColor: '#333', borderDash: [5, 5], borderWidth: 1, display: (idx100 < bins.length) }
                    }
                }
            }
        },
        plugins: [pulsePressureLabelsPlugin(bins)]
    });
    
    console.log('[Trace] bp_pulsePressure_histogram.js rendered successfully');
}