/* =====================================================================
   bp_pulse_line.js
   ---------------------------------------------------------------------
   Pulse (BPM) Line Chart
   - Safe Chart.js lifecycle
   - Linear regression trendline
   - Reference bands (Brady / Tachy)
   - Dynamic date ticks
   ===================================================================== */

console.log('bp_pulse_line.js loaded');

let pulseLineChart = null;

const pulseBandsPlugin = {
    id: 'pulseBands',
    beforeDatasetsDraw(chart) {
        const {
            ctx,
            chartArea: { left, right, top, bottom },
            scales: { y }
        } = chart;

        ctx.save();

        const tachyMin = 100;
        const bradyMax = 60;
        const fillAlpha = 0.08;
        const lineColor = '#969696';

        const yTachy = y.getPixelForValue(tachyMin);
        const yBrady = y.getPixelForValue(bradyMax);

        // Tachy band
        ctx.fillStyle = `rgba(0,0,0,${fillAlpha})`;
        ctx.fillRect(left, top, right - left, yTachy - top);
        ctx.strokeStyle = lineColor;
        ctx.beginPath();
        ctx.moveTo(left, yTachy);
        ctx.lineTo(right, yTachy);
        ctx.stroke();

        // Brady band
        ctx.fillRect(left, yBrady, right - left, bottom - yBrady);
        ctx.beginPath();
        ctx.moveTo(left, yBrady);
        ctx.lineTo(right, yBrady);
        ctx.stroke();

        // Labels
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#8c8c8c';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Tachycardia Zone', left + 6, y.getPixelForValue(103));
        ctx.fillText('Bradycardia Zone', left + 6, y.getPixelForValue(58));

        ctx.restore();
    }
};

function createPulseLineChart(bpData) {
    const canvas = document.getElementById('pulseLineChart');
    if (!canvas) {
        console.warn('pulseLineChart canvas not found – chart skipped');
        return;
    }

    const ctx = canvas.getContext('2d');
    pulseLineChart = destroyChart(pulseLineChart);

    const pulseData = bpData.map((r, i) => ({ x: i, y: r.BPM, reading: r }));
    const trendData = linearRegression(pulseData);

    pulseLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    data: pulseData,
                    borderColor: '#2D434E',
                    backgroundColor: '#2D434E',
                    borderWidth: 1,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.2
                },
                {
                    data: trendData,
                    borderColor: '#4c4c4c',
                    borderDash: [6, 6],
                    borderWidth: 0.75,
                    pointRadius: 0
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
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: () => '',
                        label(context) {
                            const r = context.raw.reading;
                            return [
                                `Pulse: ${r.BPM} bpm`,
                                '',
                                `Date: ${formatTooltipDate(r.DateObj)}`,
                                `Comments: ${r.FormComments || ''}`,
                                `ReadingID: ${r.ReadingID}`
                            ];
                        }
                    },
                    displayColors: false
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
                            if (!Number.isInteger(value) || !bpData[i]) return '';

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
                    grid: { display: false }
                },
                y: {
                    min: 55,
                    max: 105,
                    ticks: { stepSize: 5 },
                    grid: { color: 'rgba(240,240,240,1)' }
                }
            }
        },
        plugins: [pulseBandsPlugin]
    });
}

function updatePulseLineChart(filteredData) {
    createPulseLineChart(filteredData);
}