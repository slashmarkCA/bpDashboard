/* ============================================================================
   filteredNormalDonutCard.js
   ---------------------------------------------------------------------------
   Normal vs Not Normal Donut Chart
   - Hierarchical display (inner ring = parent, outer ring = children)
   - Uses BP_LEVELS for consistent colors
   - No destroyChart needed (Chart.js handles it internally)
   ============================================================================ */

import { BP_LEVELS, UI_COLORS, destroyChart } from '../utils/bp_utils.js';

let normalDonutChartInstance = null;

/**
 * Creates/updates the normal vs risky donut chart
 * @param {Array} filteredData - Filtered BP data
 */
export function createNormalDonutCard(filteredData) {
    const canvas = document.getElementById('normalDonutChart');
    if (!canvas) {
        console.error('[NORMAL DONUT] Canvas element #normalDonutChart not found');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Destroy existing instance
    normalDonutChartInstance = destroyChart(normalDonutChartInstance);

    // Handle empty data
    if (!filteredData || filteredData.length === 0) {
        console.warn('[NORMAL DONUT] No data available');
        return;
    }

    // Calculate totals using bpCat object (calculated in bp_data_normalized.js)
    const totalReadings = filteredData.length;
    const counts = { Normal: 0, Elevated: 0, Stage1: 0, Stage2: 0, Crisis: 0 };

    filteredData.forEach(r => {
        // Use the calculated bpCat object instead of source string
        if (!r.bpCat) return;
        switch (r.bpCat.label) {
            case 'Normal': counts.Normal++; break;
            case 'Elevated': counts.Elevated++; break;
            case 'Hypertension Stage 1': counts.Stage1++; break;
            case 'Hypertension Stage 2': counts.Stage2++; break;
            case 'Hypertensive Crisis': counts.Crisis++; break;
        }
    });

    const notNormalTotal = counts.Elevated + counts.Stage1 + counts.Stage2 + counts.Crisis;

    // Prepare data
    const data = {
        datasets: [
            {
                // Outer ring - children (using lightColor)
                data: [counts.Normal, counts.Elevated, counts.Stage1, counts.Stage2, counts.Crisis],
                backgroundColor: [
                    BP_LEVELS.NORMAL.lightColor, 
                    BP_LEVELS.ELEVATED.lightColor, 
                    BP_LEVELS.STAGE1.lightColor, 
                    BP_LEVELS.STAGE2.lightColor, 
                    BP_LEVELS.CRISIS.lightColor
                ],
                borderWidth: 1,
                weight: 1 
            },
            {
                // Inner ring - parents (using standard color)
                data: [counts.Normal, notNormalTotal],
                backgroundColor: [
                    BP_LEVELS.NORMAL.color, 
                    UI_COLORS.NOT_NORMAL
                ],
                borderWidth: 1,
                weight: 3 
            }
        ]
    };

    normalDonutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '40%',
            events: ['click', 'touchstart'],
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = ((value / totalReadings) * 100).toFixed(0) + '%';

                            let labelTitle = '';
                            if (context.datasetIndex === 1) {
                                const innerLabels = ['Normal Category', 'Not Normal Category'];
                                labelTitle = innerLabels[context.dataIndex];
                            } else {
                                const outerLabels = ['Normal', 'Elevated', 'Hypertension Stage 1', 'Hypertension Stage 2', 'Hypertensive Crisis'];
                                labelTitle = outerLabels[context.dataIndex];
                            }

                            return [`${labelTitle}: `, `Total: ${value}`, `${percentage} of Total Readings`];
                        }
                    }
                }
            }
        }
    });

    // Event handling
    canvas.onmouseleave = () => {
        if (normalDonutChartInstance) {
            normalDonutChartInstance.setActiveElements([]); 
            normalDonutChartInstance.update();
        }
    };
    
    console.log('[Trace] filteredNormalDonutCard.js rendered successfully');
}