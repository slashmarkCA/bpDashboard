// bp_SysDia_volatilityBoxAndWhisker.js
// ============================================================
// Sys/Dia Volatility - Final Minimalist & Precise Ticks
// ============================================================

import { getCurrentFilter } from '../utils/bp_filters.js';
import { destroyChart, formatAxisDate  } from '../utils/bp_utils.js';

let volatilityChart = null;

function createBoxWhiskerChart(filteredData) {
    const ctx = document.getElementById('boxWhiskerChart');
    if (!ctx) return;

    if (volatilityChart) { volatilityChart.destroy(); }

    const currentFilter = getCurrentFilter();
    const grouped = groupDataByVolume(filteredData, currentFilter);

    volatilityChart = new Chart(ctx, {
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
                        display: false // Labels killed for height room
                    }
                },
                y: {
                    min: 55,  // HARD FIXED
                    max: 165, // HARD FIXED
                    ticks: {
                        font: { size: 10 },
                        stepSize: 10, // REQUESTED: 10 unit increments
                        autoSkip: false // Force display on mobile if possible
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
}

function groupDataByVolume(data, filter) {
    const sysData = [];
    const diaData = [];
    const labels = [];
    const dateRanges = [];
    const sorted = [...data].sort((a, b) => a.DateObj - b.DateObj);

    if (sorted.length === 0) return { labels, sysData, diaData, dateRanges };

    // 1. Determine Window Strategy: Monthly for 'all', Weekly for everything else
    const isAll = filter === 'all';
    
    // 2. Initialize the first bucket
    let bucketStart = new Date(sorted[0].DateObj);
    bucketStart.setHours(0, 0, 0, 0);

    const getNextThreshold = (start) => {
        let d = new Date(start);
        if (isAll) {
            d.setMonth(d.getMonth() + 1, 1); // Start of next month
        } else {
            d.setDate(d.getDate() + 7); // Exactly 7 days later
        }
        return d;
    };

    let nextThreshold = getNextThreshold(bucketStart);
    let currentBucket = { sys: [], dia: [], start: new Date(bucketStart) };

    sorted.forEach((r, index) => {
        // If the reading is past the current window, close bucket and start new one
        if (r.DateObj >= nextThreshold) {
            // Label the closed bucket
            const endDisp = new Date(nextThreshold);
            endDisp.setMilliseconds(-1); // One ms before the next threshold
            
            labels.push(isAll ? 
                currentBucket.start.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) : 
                `Week ${labels.length + 1}`);
            
            dateRanges.push(`${formatAxisDate(currentBucket.start)} - ${formatAxisDate(endDisp)}`);
            sysData.push(currentBucket.sys);
            diaData.push(currentBucket.dia);

            // Reset for next window
            bucketStart = new Date(r.DateObj);
            bucketStart.setHours(0, 0, 0, 0);
            nextThreshold = getNextThreshold(bucketStart);
            currentBucket = { sys: [r.Sys], dia: [r.Dia], start: bucketStart };
        } else {
            currentBucket.sys.push(r.Sys);
            currentBucket.dia.push(r.Dia);
        }

        // Handle the very last bucket
        if (index === sorted.length - 1 && currentBucket.sys.length > 0) {
            labels.push(isAll ? 
                currentBucket.start.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) : 
                `Week ${labels.length + 1}`);
            
            // For the last range, use the last reading's date or the theoretical end
            const actualEnd = r.DateObj;
            dateRanges.push(`${formatAxisDate(currentBucket.start)} - ${formatAxisDate(actualEnd)}`);
            sysData.push(currentBucket.sys);
            diaData.push(currentBucket.dia);
        }
    });

    return { labels, sysData, diaData, dateRanges };
}

var updateBoxWhiskerChart = function(filteredData) {
    createBoxWhiskerChart(filteredData);
};

window.updateBoxWhiskerChart = updateBoxWhiskerChart;