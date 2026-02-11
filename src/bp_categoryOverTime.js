/* ============================================================================
   bp_categoryOverTime.js
   ============================================================================ */

    // TODO: Consider refining "skip" so the x-axis isn't so crowded when filtering "All". 
    // └ Would need to consider how I want the other charts to work if I do just this one.

import { 
    BP_LEVELS, 
    getBPCategory,
    destroyChart,
    formatTooltipDate, 
    formatAxisDate, 
    getCssStyles
} from '../utils/bp_utils.js';

let categoryChart = null;
const cssStyle = getCssStyles("light", "chart");

/**
 * Custom Label Plugin
 * Draws category names on the left side of the chart area
 */
const categoryLabelPlugin = {
    id: 'categoryLabels',
    afterDatasetsDraw(chart) {
        const { ctx, chartArea: { left, top, bottom }, scales: { y } } = chart;

        const labels = [
            { text: 'Normal',                 yValue: 1 },
            { text: 'Elevated',               yValue: 2 },
            { text: 'Hypertension Stage 1',   yValue: 3 },
            { text: 'Hypertension Stage 2',   yValue: 4 },
            { text: 'Hypertensive Crisis',    yValue: 5 }
        ];

        ctx.save();
        labels.forEach(label => {
            const yPixel = y.getPixelForValue(label.yValue);
            const xPixel = left + 10; 

            // ADJUST THIS VALUE: 
            // +5 moves it 5 pixels down, -5 moves it 5 pixels up
            const verticalNudge = 12; 

            if (yPixel >= top && yPixel <= bottom) {
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top'; // Your current setting
                
                // Apply the nudge here
                ctx.fillText(label.text, xPixel, yPixel + verticalNudge);
            }
        });
        ctx.restore();
    }
};

export function createCategoryChart(bpData) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;

    categoryChart = destroyChart(categoryChart);

    if (!bpData?.length) return;

    const processed = bpData.map((r, i) => {
        const level = getBPCategory(r.Sys, r.Dia); 
        return {
            x: i,
            y: level.score,
            label: level.label,
            color: level.color,
            reading: r
        };
    });

    // Determine the max index to force the chart to stretch to the right edge
    const maxIndex = processed.length > 0 ? processed.length - 1 : 0;

    const levelAnnotations = {};
    Object.values(BP_LEVELS).forEach(lvl => {
        if (lvl.score === 0) return;
        
        levelAnnotations[lvl.label.toLowerCase()] = {
            type: 'box',
            drawTime: 'beforeDatasetsDraw',
            yMin: lvl.score - 0.5,
            yMax: lvl.score + 0.5,
            backgroundColor: lvl.color.replace('1)', '0.15)'),
            borderWidth: 0
        };
    });

    categoryChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            datasets: [{
                data: processed,
                borderColor: '#333',
                borderWidth: 1,
                stepped: 'after',
                pointRadius: 2,
                pointBackgroundColor: processed.map(p => p.color),
                pointBorderColor: '#a8a8a8',
                pointBorderWidth: 2,
                tension: 0,
                z: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    min: 0,        // Force start at left edge
                    max: maxIndex, // Force end at right edge
                    grid: { display: false },
                    ticks: {
                        font: {
                            weight: cssStyle.weight, 
                            size: cssStyle.size, 
                            family: cssStyle.family,
                        },
                        color: cssStyle.color,
                        maxRotation: 90,
                        minRotation: 90,
                        callback: function(value) {
                            const i = Math.round(value);
                            if (!processed[i]) return '';
                            const total = processed.length;
                            let skip = total > 100 ? 10 : (total > 50 ? 5 : (total > 20 ? 2 : 1));
                            return i % skip === 0 ? formatAxisDate(processed[i].reading.DateObj) : '';
                        }
                    }
                },
                y: {
                    min: 0.5,
                    max: 5.5,
                    grid: { color: '#eeeeee', drawTicks: false },
                    ticks: {
                        stepSize: 1,
                        callback: (value) => {
                            const level = Object.values(BP_LEVELS).find(l => l.score === value);
                            return level ? level.label : '';
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                annotation: {
                    annotations: levelAnnotations
                },
                tooltip: {
                    displayColors: false,
                    callbacks: {
                        title: () => '',
                        label: (ctx) => {
                            const r = ctx.raw.reading;
                            return [
                                `Category: ${ctx.raw.label}`,
                                `Sys/Dia: ${r.Sys}/${r.Dia}`,
                                `Date: ${formatTooltipDate(r.DateObj)}`,
                                `ID: ${r.ReadingID}`
                            ];
                        }
                    }
                }
            }
        },
        plugins: [categoryLabelPlugin] 
    });
}