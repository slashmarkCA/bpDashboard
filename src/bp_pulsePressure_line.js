/* ============================================================
   bp_pulsePressure_line.js
   ------------------------------------------------------------
   Pulse Pressure Line Chart
   - Data source: gPulsePressure
   - Reference bands (Tableau-style)
   - Gridlines ABOVE bands
   - ✅ Linear regression trendline
   ============================================================ */

console.log('bp_pulsePressure_line.js loaded');

let pulsePressureLineChart = null;

const pulsePressureBandsPlugin = {
    id: 'pulsePressureBands',
    beforeDraw(chart) {
        const {
            ctx,
            chartArea: { left, right },
            scales: { y }
        } = chart;

        ctx.save();

        const bands = [
            { label: 'Narrowed',     min: 0,   max: 40,  fill: '#eeb649' },
            { label: 'Normal',       min: 40,  max: 60,  fill: '#204929' },
            { label: 'Widened',      min: 60,  max: 100, fill: '#d95139' },
            { label: 'Very Widened', min: 100, max: 108, fill: '#ad322d' }
        ];

        const fillAlpha = 0.15;

        bands.forEach(b => {
            const yTop = y.getPixelForValue(b.max);
            const yBottom = y.getPixelForValue(b.min);
            ctx.globalAlpha = fillAlpha;
            ctx.fillStyle = b.fill;
            ctx.fillRect(left, yTop, right - left, yBottom - yTop);
        });

        ctx.restore();
    },
    afterDatasetsDraw(chart) {
        const {
            ctx,
            chartArea: { left },
            scales: { y }
        } = chart;

        ctx.save();
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = 0.6;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const labels = [
            { text: 'Very Widened', value: 103 },
            { text: 'Widened',      value: 63 },
            { text: 'Normal',       value: 43 },
            { text: 'Narrowed',     value: 3 }
        ];

        labels.forEach(l => {
            ctx.fillText(l.text, left + 6, y.getPixelForValue(l.value));
        });

        ctx.restore();
    }
};

function createPulsePressureLineChart(bpData) {
    const canvas = document.getElementById('pulsePressureLineChart');
    if (!canvas) {
        console.warn('pulsePressureLineChart canvas not found – chart skipped');
        return;
    }

    const ctx = canvas.getContext('2d');
    pulsePressureLineChart = destroyChart(pulsePressureLineChart);

    const pulsePressureData = bpData
        .filter(r => r.gPulsePressure != null)
        .map((r, idx) => ({ x: idx, y: r.gPulsePressure, reading: r }));

    // ✅ Calculate trendline using utility function
    const ppTrend = linearRegression(pulsePressureData);

    pulsePressureLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Pulse Pressure',
                    data: pulsePressureData,
                    borderColor: '#2D434E',
                    backgroundColor: '#2D434E',
                    borderWidth: 1.5,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointHitRadius: 10,
                    tension: 0.2,
                    order: 1
                },
                // Trendline
                {
                    data: ppTrend,
                    borderColor: '#1a2a33',
                    borderDash: [6, 6],
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                    labels: {
                        // Hide trendline from legend
                        filter: item => item.text
                    }
                },
                tooltip: {
                    callbacks: {
                        title: () => '',
                        label(context) {
                            // Skip tooltips for trendline
                            if (!context.raw.reading) return null;

                            const r = context.raw.reading;
                            return [
                                `Pulse Pressure: ${r.gPulsePressure}`,
                                `Date: ${formatAxisDate(r.DateObj)}`,
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
                        maxRotation: 90,
                        minRotation: 90,
                        autoSkip: false,
                        font: { size: 10 }
                    },
                    grid: { color: 'rgba(0,0,0,0)' }
                },
                y: {
                    min: 0,
                    max: 108,
                    ticks: { stepSize: 5 },
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawTicks: false
                    }
                }
            }
        },
        plugins: [pulsePressureBandsPlugin]
    });
}

function updatePulsePressureLineChart(filteredData) {
    createPulsePressureLineChart(filteredData);
}