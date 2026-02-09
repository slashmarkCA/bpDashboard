/* ============================================================================
   bp_charts_scatter.js
   ---------------------------------------------------------------------------
   Sys / Dia Scatter Chart with Clinical Background Zones
   - Workday vs Non-workday differentiation
   - Clinical zone shading
   - Standardized ES6 module pattern
   ============================================================================ */

import { BP_LEVELS, destroyChart, getCssStyles } from '../utils/bp_utils.js';

let scatterChartInstance = null;
const cssStyle = getCssStyles("light", "chart"); // call in some css styles from styles.css via bp_utils.js

/**
 * Background shading plugin
 * Draws clinical BP zones behind the scatter points
 */
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

        // Clinical zones using BP_LEVELS
        const zones = [
            { xMin: 0,   xMax: 80,  yMin: 0,   yMax: 120, color: BP_LEVELS.NORMAL.color },
            { xMin: 0,   xMax: 80,  yMin: 120, yMax: 130, color: BP_LEVELS.ELEVATED.color },
            { xMin: 0,   xMax: 80,  yMin: 130, yMax: 140, color: BP_LEVELS.STAGE1.color },
            { xMin: 80,  xMax: 90,  yMin: 0,   yMax: 140, color: BP_LEVELS.STAGE1.color },
            { xMin: 0,   xMax: 120, yMin: 139, yMax: 180, color: BP_LEVELS.STAGE2.color },
            { xMin: 90,  xMax: 120, yMin: 0,   yMax: 140, color: BP_LEVELS.STAGE2.color },
            { xMin: 0,   xMax: 130, yMin: 180, yMax: 200, color: BP_LEVELS.CRISIS.color },
            { xMin: 120, xMax: 130, yMin: 0,   yMax: 200, color: BP_LEVELS.CRISIS.color }
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

            if (xPixel < left || xPixel > right || yPixel < top || yPixel > bottom) return;

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

/**
 * Creates/updates the scatter chart
 * @param {Array} filteredData - Filtered BP data
 */
export function createScatterChart(filteredData) {
    const canvas = document.getElementById('bpScatterChart');
    if (!canvas) {
        console.error('[SCATTER CHART] Canvas element #bpScatterChart not found');
        return;
    }

    // Destroy existing instance
    scatterChartInstance = destroyChart(scatterChartInstance);

    // Handle empty data
    if (!filteredData?.length) {
        console.warn('[SCATTER CHART] No data available');
        return;
    }

    const workdayData = [];
    const nonWorkdayData = [];

    filteredData.forEach(r => {
        const point = {
            x: r.Dia,
            y: r.Sys,
            date: r.Date,
            workday: r.Workday,
            comments: r.FormComments || ''
        };
        (r.Workday === 'Yes' ? workdayData : nonWorkdayData).push(point);
    });

    scatterChartInstance = new Chart(canvas.getContext('2d'), {
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
                            if (p.comments) lines.push(`Comments: ${p.comments}`);
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
                        font: { 
                            size: cssStyle.axisTitleSize, 
                            weight: cssStyle.axisTitleWeight 
                        },
                        color: cssStyle.color,
                    },
                    ticks: {
                        font: {
                            weight: cssStyle.weight, 
                            size: cssStyle.size, 
                            family: cssStyle.family,
                        },
                        color: cssStyle.color,
                    }, 
                },
                y: {
                    min: 40,
                    max: 200,
                    title: {
                        display: true,
                        text: 'Sys',
                        font: { 
                            size: cssStyle.axisTitleSize, 
                            weight: cssStyle.axisTitleWeight 
                        },
                        color: cssStyle.color,
                    },
                    ticks: {
                        font: {
                            weight: cssStyle.weight, 
                            size: cssStyle.size, 
                            family: cssStyle.family,
                        },
                        color: cssStyle.color,
                    }, 
                }
            }
        },
        plugins: [backgroundPlugin]
    });
    
    console.log('[Trace] bp_charts_scatter.js rendered successfully');
}