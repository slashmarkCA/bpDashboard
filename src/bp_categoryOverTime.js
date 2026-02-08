/* ============================================================================
   bp_categoryOverTime.js
   ---------------------------------------------------------------------------
   Reading Categories Over Time (Stepped Line Chart)
   - Shows BP category transitions
   - Color-coded background zones
   - Standardized lifecycle management
   ============================================================================ */

import { 
    BP_LEVELS, 
    getBPCategory,
    destroyChart,
    formatTooltipDate, 
    formatAxisDate 
} from '../utils/bp_utils.js';

let categoryChart = null;

/**
 * Creates/updates the category over time chart
 * @param {Array} bpData - Filtered BP data
 */
export function createCategoryChart(bpData) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) {
        console.error('[CATEGORY CHART] Canvas element #categoryChart not found');
        return;
    }

    // Destroy existing instance
    categoryChart = destroyChart(categoryChart);

    // Handle empty data
    if (!bpData?.length) {
        console.warn('[CATEGORY CHART] No data available');
        return;
    }

    // Process data with BP categories
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

    // Dynamic annotations for background zones
    const levelAnnotations = {};
    Object.values(BP_LEVELS).forEach(lvl => {
        if (lvl.score === 0) return; // Skip UNKNOWN
        
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
                pointRadius: 1.5,
                pointBackgroundColor: processed.map(p => p.color),
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1,
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
                    grid: { display: false },
                    ticks: {
                        font: { size: 10 },
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
        }
    });
    
    console.log('[Trace] bp_categoryOverTime.js rendered successfully');
}