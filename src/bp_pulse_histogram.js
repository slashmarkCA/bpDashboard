/* ============================================================
   bp_pulse_histogram.js
   Pulse Histogram with Clinical Background Shading
============================================================ */

console.log('bp_pulse_histogram.js loaded');

let pulseHistogramChart = null;

function buildPulseHistogram(bpData, bucketSize = 5) {
    const values = bpData.map(r => r.BPM).filter(v => v != null);
    if (!values.length) return [];

    const minVal = Math.floor(Math.min(...values) / bucketSize) * bucketSize;
    const maxVal = Math.ceil(Math.max(...values) / bucketSize) * bucketSize;

    const bins = [];
    for (let v = minVal; v < maxVal; v += bucketSize) {
        bins.push({ start: v, end: v + bucketSize, count: 0 });
    }

    values.forEach(v => {
        const idx = Math.floor((v - minVal) / bucketSize);
        if (bins[idx]) bins[idx].count++;
    });

    return bins;
}

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

function createPulseHistogramChart(bpData) {
    const canvas = document.getElementById('pulseHistogram');
    if (!canvas) {
        console.warn('pulseHistogram canvas not found – chart skipped');
        return;
    }

    const ctx = canvas.getContext('2d');
    pulseHistogramChart = destroyChart(pulseHistogramChart);

    const bins = buildPulseHistogram(bpData);
    if (!bins.length) return;

    const total = bpData.length;

    const hasBrady = bins.some(b => b.end <= 60 && b.count > 0);
    const hasTachy = bins.some(b => b.start >= 100 && b.count > 0);

    let split60 = bins.findIndex(b => b.start >= 60);
    if (split60 === -1) split60 = bins.length;
    const indexAt60 = split60 - 0.5;

    let split100 = bins.findIndex(b => b.start >= 100);
    if (split100 === -1) split100 = bins.length;
    const indexAt100 = split100 - 0.5;

    const maxCount = Math.max(...bins.map(b => b.count), 1);
    const yMax = Math.ceil(maxCount * 1.35);

    pulseHistogramChart = new Chart(ctx, {
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
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                annotation: {
                    annotations: {
                        bradyZone: {
                            type: 'box',
                            xMin: -0.5,
                            xMax: indexAt60,
                            backgroundColor: 'rgba(91,192,222,0.12)',
                            borderWidth: 0,
                            display: hasBrady,
                            label: {
                                display: hasBrady,
                                content: 'BRADYCARDIA',
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
                            borderColor: 'rgba(0,0,0,0.35)',
                            borderDash: [4, 4],
                            borderWidth: 1,
                            display: hasBrady
                        },
                        normalZone: {
                            type: 'box',
                            xMin: indexAt60,
                            xMax: indexAt100,
                            backgroundColor: 'rgba(47,107,63,0.10)',
                            borderWidth: 0,
                            label: {
                                display: true,
                                content: 'NORMAL',
                                position: { x: 'start', y: 'start' },
                                yAdjust: 12,
                                font: { size: 10, weight: 'bold' },
                                color: 'rgba(0,0,0,0.45)'
                            }
                        },
                        tachyDivider: {
                            type: 'line',
                            xMin: indexAt100,
                            xMax: indexAt100,
                            borderColor: 'rgba(0,0,0,0.35)',
                            borderDash: [4, 4],
                            borderWidth: 1,
                            display: hasTachy
                        },
                        tachyZone: {
                            type: 'box',
                            xMin: indexAt100,
                            xMax: bins.length - 0.5,
                            backgroundColor: 'rgba(217,81,57,0.12)',
                            borderWidth: 0,
                            display: hasTachy,
                            label: {
                                display: hasTachy,
                                content: 'TACHYCARDIA',
                                position: { x: 'start', y: 'start' },
                                yAdjust: 12,
                                font: { size: 10, weight: 'bold' },
                                color: 'rgba(0,0,0,0.45)'
                            }
                        }
                    }
                }
            }
        },
        plugins: [pulseHistogramLabelsPlugin(bins, total)]
    });
}

function updatePulseHistogramChart(filteredData) {
    createPulseHistogramChart(filteredData);
}