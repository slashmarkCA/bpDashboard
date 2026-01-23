/* ============================================================
   bp_charts_scatter.js
   ------------------------------------------------------------
   Sys / Dia Scatter Chart with Clinical Background Zones
   - Background shading plugin
   - Workday vs Non-Workday points
   ============================================================ */

console.log('bp_charts_scatter.js loaded');

const backgroundPlugin = {
    id: 'customBackground',
    beforeDatasetsDraw(chart) {
        const {
            ctx,
            chartArea: { left, right, top, bottom },
            scales: { x, y }
        } = chart;

        ctx.save();
        ctx.beginPath();
        ctx.rect(left, top, right - left, bottom - top);
        ctx.clip();

        const zones = [
            { xMin: 0,   xMax: 80,  yMin: 0,   yMax: 120, color: '#30693c' },
            { xMin: 0,   xMax: 80,  yMin: 120, yMax: 130, color: '#204929' },
            { xMin: 0,   xMax: 80,  yMin: 130, yMax: 140, color: '#eeb649' },
            { xMin: 80,  xMax: 90,  yMin: 0,   yMax: 140, color: '#eeb649' },
            { xMin: 0,   xMax: 120, yMin: 139, yMax: 180, color: '#d95139' },
            { xMin: 90,  xMax: 120, yMin: 0,   yMax: 140, color: '#d95139' },
            { xMin: 0,   xMax: 130, yMin: 180, yMax: 200, color: '#ad322d' },
            { xMin: 120, xMax: 130, yMin: 0,   yMax: 200, color: '#ad322d' }
        ];

        const labels = [
            { text: 'Normal',                 xValue: 43, yValue: 45 },
            { text: 'Elevated',               xValue: 43, yValue: 124 },
            { text: 'Hypertension Stage 1',   xValue: 43, yValue: 134 },
            { text: 'Hypertension Stage 2',   xValue: 43, yValue: 144 },
            { text: 'Hypertensive Crisis',    xValue: 43, yValue: 184 }
        ];

        zones.forEach(zone => {
            const xStart = Math.max(x.getPixelForValue(zone.xMin), left);
            const xEnd   = Math.min(x.getPixelForValue(zone.xMax), right);
            const yStart = Math.min(y.getPixelForValue(zone.yMax), bottom);
            const yEnd   = Math.max(y.getPixelForValue(zone.yMin), top);

            ctx.globalAlpha = 1.0;
            ctx.fillStyle = zone.color;
            ctx.fillRect(xStart, yEnd, xEnd - xStart, yStart - yEnd);
        });

        labels.forEach(label => {
            const xPixel = x.getPixelForValue(label.xValue);
            const yPixel = y.getPixelForValue(label.yValue);

            if (xPixel < left || xPixel > right || yPixel < top  || yPixel > bottom) {
                return;
            }

            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label.text, xPixel, yPixel);
        });

        ctx.restore();
    }
};

let scatterChart = null;

function createScatterChart(bpData) {
    const canvas = document.getElementById('bpScatterChart');
    if (!canvas) {
        console.warn('bpScatterChart canvas not found – chart skipped');
        return;
    }

    const ctx = canvas.getContext('2d');
    scatterChart = destroyChart(scatterChart);

    const workdayData = [];
    const nonWorkdayData = [];

    bpData.forEach(r => {
        const point = {
            x: r.Dia,
            y: r.Sys,
            date: r.Date,
            workday: r.Workday,
            comments: r.FormComments || ''
        };

        (r.Workday === 'Yes' ? workdayData : nonWorkdayData).push(point);
    });

    scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Workday',
                    data: workdayData,
                    backgroundColor: '#2c2c2c',
                    borderColor: '#2c2c2c',
                    pointRadius: 3,
                    pointHoverRadius: 7
                },
                {
                    label: 'Non-Workday',
                    data: nonWorkdayData,
                    backgroundColor: '#ffffff',
                    borderColor: '#2c2c2c',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'nearest',
                    intersect: true,
                    callbacks: {
                        label(context) {
                            const p = context.raw;
                            const lines = [
                                `Sys: ${p.y}`,
                                `Dia: ${p.x}`,
                                `Date: ${p.date}`,
                                `Workday: ${p.workday}`
                            ];
                            if (p.comments) {
                                lines.push(`Comments: ${p.comments}`);
                            }
                            return lines;
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: 40,
                    max: 130,
                    title: {
                        display: true,
                        text: 'Dia',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                y: {
                    min: 40,
                    max: 200,
                    title: {
                        display: true,
                        text: 'Sys',
                        font: { size: 14, weight: 'bold' }
                    }
                }
            }
        },
        plugins: [backgroundPlugin]
    });
}

function updateScatterChart(filteredData) {
    createScatterChart(filteredData);
}