/* ============================================================================
   bp_pulsePressure_histogram.js
   Pulse Pressure Histogram with Clinical Background Zones
============================================================================ */

console.log('bp_pulsePressure_histogram.js loaded');

let pulsePressureHistogramChart = null;

function buildPulsePressureHistogram(bpData, bucketSize = 5) {
    const buckets = {};
    const total = bpData.length;

    bpData.forEach(r => {
        if (r.gPulsePressure == null) return;

        const start = Math.floor(r.gPulsePressure / bucketSize) * bucketSize;
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

function pulsePressureLabelsPlugin(bins, total) {
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

function createPulsePressureHistogram(bpData) {
    const canvas = document.getElementById('pulsePressureHistogram');
    if (!canvas) {
        console.warn('pulsePressureHistogram canvas not found – chart skipped');
        return;
    }

    const ctx = canvas.getContext('2d');
    pulsePressureHistogramChart = destroyChart(pulsePressureHistogramChart);

    const bins = buildPulsePressureHistogram(bpData);
    if (!bins.length) return;

    const labels = bins.map(b => `${b.start}-${b.end}`);
    const counts = bins.map(b => b.count);

    const hasNarrowed = bins.some(b => b.end <= 40 && b.count > 0);
    const hasWidened = bins.some(b => b.start >= 60 && b.start < 100 && b.count > 0);
    const hasVeryWidened = bins.some(b => b.start >= 100 && b.count > 0);

    let split40 = bins.findIndex(b => b.start >= 40);
    if (split40 === -1) split40 = bins.length;
    const idx40 = split40 - 0.5;

    let split60 = bins.findIndex(b => b.start >= 60);
    if (split60 === -1) split60 = bins.length;
    const idx60 = split60 - 0.5;

    let split100 = bins.findIndex(b => b.start >= 100);
    if (split100 === -1) split100 = bins.length;
    const idx100 = split100 - 0.5;

    const maxCount = Math.max(...counts, 1);
    const yMax = Math.ceil(maxCount * 1.35);

    pulsePressureHistogramChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: counts,
                backgroundColor: '#2c3e50',
                borderWidth: 0,
                barPercentage: 0.85
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    max: yMax,
                    ticks: { display: false },
                    grid: { color: '#eeeeee' }
                }
            },
            plugins: {
                legend: { display: false },
                annotation: {
                    annotations: {
                        narrowed: {
                            type: 'box',
                            xMin: -0.5,
                            xMax: idx40,
                            backgroundColor: 'rgba(238,182,73,0.15)',
                            borderWidth: 0,
                            display: hasNarrowed,
                            label: {
                                display: hasNarrowed,
                                content: 'NARROWED',
                                position: { x: 'start', y: 'start' },
                                yAdjust: 12,
                                font: { size: 10, weight: 'bold' },
                                color: 'rgba(0,0,0,0.45)'
                            }
                        },
                        normal: {
                            type: 'box',
                            xMin: idx40,
                            xMax: idx60,
                            backgroundColor: 'rgba(32,73,41,0.12)',
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
                        widened: {
                            type: 'box',
                            xMin: idx60,
                            xMax: idx100,
                            backgroundColor: 'rgba(217,81,57,0.12)',
                            borderWidth: 0,
                            display: hasWidened,
                            label: {
                                display: hasWidened,
                                content: 'WIDENED',
                                position: { x: 'start', y: 'start' },
                                yAdjust: 12,
                                font: { size: 10, weight: 'bold' },
                                color: 'rgba(0,0,0,0.45)'
                            }
                        },
                        veryWidened: {
                            type: 'box',
                            xMin: idx100,
                            xMax: bins.length - 0.5,
                            backgroundColor: 'rgba(173,50,45,0.15)',
                            borderWidth: 0,
                            display: hasVeryWidened,
                            label: {
                                display: hasVeryWidened,
                                content: 'VERY WIDENED',
                                position: { x: 'start', y: 'start' },
                                yAdjust: 12,
                                font: { size: 10, weight: 'bold' },
                                color: 'rgba(0,0,0,0.45)'
                            }
                        },
                        ref40: {
                            type: 'line',
                            xMin: idx40,
                            xMax: idx40,
                            borderColor: '#333',
                            borderDash: [4, 4],
                            borderWidth: 1
                        },
                        ref60: {
                            type: 'line',
                            xMin: idx60,
                            xMax: idx60,
                            borderColor: '#333',
                            borderDash: [4, 4],
                            borderWidth: 1
                        },
                        ref100: {
                            type: 'line',
                            xMin: idx100,
                            xMax: idx100,
                            borderColor: '#333',
                            borderDash: [4, 4],
                            borderWidth: 1
                        }
                    }
                }
            }
        },
        plugins: [pulsePressureLabelsPlugin(bins)]
    });
}

function updatePulsePressureHistogram(filteredData) {
    createPulsePressureHistogram(filteredData);
}