/* ============================================================================
   bp_pulse_histogram.js
   ---------------------------------------------------------------------------
   Pulse Histogram with Clinical Background Shading
   - Bradycardia/Normal/Tachycardia zones
   - Auto-binning with medical thresholds
   - Percentage labels on bars
   ============================================================================ */

import { PULSE_LEVELS, destroyChart, getAlphaColor } from '../utils/bp_utils.js';

let pulseHistogramChartInstance = null;

/**
 * Builds histogram bins from BPM data
 * @param {Array} bpData - BP readings
 * @param {number} bucketSize - Bin width
 * @returns {Array} Histogram bins
 */
function buildPulseHistogram(bpData, bucketSize = 5) {
    const values = bpData
        .map(r => Number(r.BPM || r.Pulse))
        .filter(v => !isNaN(v) && v > 0);
        
    if (!values.length) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);

    const minVal = Math.floor(min / bucketSize) * bucketSize;
    const maxVal = Math.floor(max / bucketSize) * bucketSize + bucketSize;

    const bins = [];
    for (let v = minVal; v < maxVal; v += bucketSize) {
        bins.push({ start: v, end: v + bucketSize, count: 0 });
    }

    values.forEach(v => {
        const idx = Math.floor((v - minVal) / bucketSize);
        if (bins[idx]) {
            bins[idx].count++;
        }
    });

    return bins;
}

/**
 * Plugin to draw percentage labels on bars
 */
function pulseHistogramLabelsPlugin(bins, total) {
    return {
        id: 'pulseHistogramLabels',
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

                const pct = Math.round((b.count / total) * 100);
                const label = `${b.count} (${pct}%)`;
                const y = Math.max(bar.y - 6, scales.y.top + 18);
                ctx.fillText(label, bar.x, y);
            });

            ctx.restore();
        }
    };
}

/**
 * Creates/updates the pulse histogram
 * @param {Array} filteredData - Filtered BP data
 */
export function createPulseHistogramChart(filteredData) {
    const canvas = document.getElementById('pulseHistogram');
    if (!canvas) {
        console.error('[PULSE HISTOGRAM] Canvas element #pulseHistogram not found');
        return;
    }

    // Destroy existing instance
    pulseHistogramChartInstance = destroyChart(pulseHistogramChartInstance);

    // Handle empty data
    if (!filteredData?.length) {
        console.warn('[PULSE HISTOGRAM] No data available');
        return;
    }

    const ctx = canvas.getContext('2d');
    const bins = buildPulseHistogram(filteredData);
    
    if (!bins.length) {
        console.warn('[PULSE HISTOGRAM] No bins generated');
        return;
    }

    const total = filteredData.length;

    // Calculate zone boundaries (bin indices where thresholds fall)
    const split60Idx = bins.findIndex(b => b.start >= 60);
    const indexAt60 = (split60Idx === -1) ? bins.length - 0.5 : split60Idx - 0.5;

    const split100Idx = bins.findIndex(b => b.start >= 100);
    const indexAt100 = (split100Idx === -1) ? bins.length + 0.5 : split100Idx - 0.5;

    const maxCount = Math.max(...bins.map(b => b.count), 1);
    const yMax = Math.ceil(maxCount * 1.5);

    pulseHistogramChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: bins.map(b => `${b.start}-${b.end}`),
            datasets: [{
                data: bins.map(b => b.count),
                backgroundColor: '#2c3e50',
                borderRadius: 4,
                barPercentage: 0.85
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: yMax,
                    ticks: { display: false },
                    grid: { color: 'rgba(0,0,0,0.08)' }
                },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                annotation: {
                    annotations: {
                        bradyZone: {
                            type: 'box',
                            xMin: -0.5,
                            xMax: indexAt60,
                            backgroundColor: getAlphaColor(PULSE_LEVELS.BRADY.color, 0.12),
                            borderWidth: 0,
                            label: {
                                display: (indexAt60 > -0.5),
                                content: PULSE_LEVELS.BRADY.label.toUpperCase(),
                                position: { x: 'start', y: 'start' },
                                yAdjust: 12,
                                font: { size: 10, weight: 'bold' },
                                color: 'rgba(0,0,0,0.45)'
                            }
                        },
                        bradyDivider: {
                            type: 'line',
                            xMin: indexAt60,
                            xMax: indexAt60,
                            borderColor: 'rgba(0,0,0,0.3)',
                            borderDash: [5, 5],
                            borderWidth: 1.5,
                            display: (indexAt60 > -0.5 && indexAt60 < bins.length)
                        },
                        normalZone: {
                            type: 'box',
                            xMin: indexAt60,
                            xMax: indexAt100,
                            backgroundColor: getAlphaColor(PULSE_LEVELS.NORMAL.color, 0.06),
                            borderWidth: 0,
                            label: {
                                display: true,
                                content: PULSE_LEVELS.NORMAL.label.toUpperCase().replace(' PULSE', ''),
                                position: { x: 'start', y: 'start' },
                                yAdjust: 12,
                                font: { size: 10, weight: 'bold' },
                                color: 'rgba(0,0,0,0.4)'
                            }
                        },
                        tachyDivider: {
                            type: 'line',
                            xMin: indexAt100,
                            xMax: indexAt100,
                            borderColor: 'rgba(0,0,0,0.3)',
                            borderDash: [5, 5],
                            borderWidth: 1.5,
                            display: (indexAt100 < bins.length)
                        },
                        tachyZone: {
                            type: 'box',
                            xMin: indexAt100,
                            xMax: bins.length - 0.5,
                            backgroundColor: getAlphaColor(PULSE_LEVELS.TACHY.color, 0.12),
                            borderWidth: 0,
                            display: (indexAt100 < bins.length),
                            label: {
                                display: (indexAt100 < bins.length),
                                content: 'TACHY',
                                position: { x: 'center', y: 'start' },
                                yAdjust: 10,
                                font: { size: 10, weight: 'bold' },
                                color: getAlphaColor(PULSE_LEVELS.TACHY.color, 0.8)
                            }
                        }
                    }
                }
            }
        },
        plugins: [pulseHistogramLabelsPlugin(bins, total)]
    });

    console.log('[Trace] bp_pulse_histogram.js rendered successfully', { 
        indexAt60, 
        indexAt100, 
        binCount: bins.length
    });
}