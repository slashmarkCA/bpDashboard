/* ============================================================================
   bp_SysDia_volatilityBoxAndWhisker.js
   ---------------------------------------------------------------------------
   Sys/Dia Volatility - Box & Whisker Chart
   - Weekly or monthly grouping based on filter
   - Shows min/max/median/quartiles
   - Fixed y-axis scale for consistency
   ============================================================================ */

import { getCurrentFilter } from '../utils/bp_filters.js';
import { destroyChart, formatAxisDate } from '../utils/bp_utils.js';

let volatilityChart = null;

/**
 * Groups data into time windows for box plot
 * @param {Array} data - Filtered BP data
 * @param {string} filter - Current filter setting
 * @returns {Object} Grouped data with labels
 */
function groupDataByVolume(data, filter) {
    const sysData = [];
    const diaData = [];
    const labels = [];
    const dateRanges = [];
    const sorted = [...data].sort((a, b) => a.DateObj - b.DateObj);

    if (sorted.length === 0) return { labels, sysData, diaData, dateRanges };

    // Monthly for 'all', Weekly for everything else
    const isAll = filter === 'all';
    
    let bucketStart = new Date(sorted[0].DateObj);
    bucketStart.setHours(0, 0, 0, 0);

    const getNextThreshold = (start) => {
        let d = new Date(start);
        if (isAll) {
            d.setMonth(d.getMonth() + 1, 1);
        } else {
            d.setDate(d.getDate() + 7);
        }
        return d;
    };

    let nextThreshold = getNextThreshold(bucketStart);
    let currentBucket = { sys: [], dia: [], start: new Date(bucketStart) };

    sorted.forEach((r, index) => {
        if (r.DateObj >= nextThreshold) {
            // Close current bucket
            const endDisp = new Date(nextThreshold);
            endDisp.setMilliseconds(-1);
            
            labels.push(isAll ? 
                currentBucket.start.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) : 
                `Week ${labels.length + 1}`);
            
            dateRanges.push(`${formatAxisDate(currentBucket.start)} - ${formatAxisDate(endDisp)}`);
            sysData.push(currentBucket.sys);
            diaData.push(currentBucket.dia);

            // Start new bucket
            bucketStart = new Date(r.DateObj);
            bucketStart.setHours(0, 0, 0, 0);
            nextThreshold = getNextThreshold(bucketStart);
            currentBucket = { sys: [r.Sys], dia: [r.Dia], start: bucketStart };
        } else {
            currentBucket.sys.push(r.Sys);
            currentBucket.dia.push(r.Dia);
        }

        // Handle last bucket
        if (index === sorted.length - 1 && currentBucket.sys.length > 0) {
            labels.push(isAll ? 
                currentBucket.start.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) : 
                `Week ${labels.length + 1}`);
            
            const actualEnd = r.DateObj;
            dateRanges.push(`${formatAxisDate(currentBucket.start)} - ${formatAxisDate(actualEnd)}`);
            sysData.push(currentBucket.sys);
            diaData.push(currentBucket.dia);
        }
    });

    return { labels, sysData, diaData, dateRanges };
}

/**
 * Creates/updates the box & whisker chart
 * @param {Array} filteredData - Filtered BP data
 */
export function createBoxWhiskerChart(filteredData) {
    const canvas = document.getElementById('boxWhiskerChart');
    if (!canvas) {
        console.error('[BOX WHISKER] Canvas element #boxWhiskerChart not found');
        return;
    }

    // Destroy existing instance
    volatilityChart = destroyChart(volatilityChart);

    // Handle empty data
    if (!filteredData?.length) {
        console.warn('[BOX WHISKER] No data available');
        return;
    }

    const currentFilter = getCurrentFilter();
    const grouped = groupDataByVolume(filteredData, currentFilter);

    volatilityChart = new Chart(canvas.getContext('2d'), {
        type: 'boxplot',
        data: {
            labels: grouped.labels,
            datasets: [
                {
                    label: 'Systolic',
                    backgroundColor: 'rgba(211, 47, 47, 0.5)',
                    borderColor: '#d32f2f',
                    borderWidth: 1,
                    itemRadius: 2,
                    data: grouped.sysData,
                    dateRanges: grouped.dateRanges
                },
                {
                    label: 'Diastolic',
                    backgroundColor: 'rgba(25, 118, 210, 0.5)',
                    borderColor: '#1976d2',
                    borderWidth: 1,
                    itemRadius: 2,
                    data: grouped.diaData,
                    dateRanges: grouped.dateRanges
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: true,
                        drawOnChartArea: true,
                        drawTicks: false
                    },
                    ticks: {
                        display: false
                    }
                },
                y: {
                    min: 55,
                    max: 165,
                    ticks: {
                        font: { size: 10 },
                        stepSize: 10,
                        autoSkip: false
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { boxWidth: 10, font: { size: 10 } }
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        title: function(context) {
                            const index = context[0].dataIndex;
                            return context[0].dataset.dateRanges[index];
                        },
                        label: function(context) {
                            const values = context.raw;
                            const type = context.dataset.label;

                            if (!Array.isArray(values) || values.length === 0) {
                                return `${type}: No data`;
                            }

                            const count = values.length;
                            const high = Math.max(...values);
                            const low = Math.min(...values);
                            const avg = (values.reduce((a, b) => a + b, 0) / count).toFixed(1);

                            return [
                                `${type}`,
                                `High: ${high}`,
                                `Low: ${low}`,
                                `Avg: ${avg}`,
                                `# of Readings: ${count}`
                            ];
                        }
                    }
                }
            }
        }
    });
    
    console.log('[Trace] bp_SysDia_volatilityBoxAndWhisker.js rendered successfully');
}