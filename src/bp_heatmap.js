import { BP_LEVELS } from '../utils/bp_utils.js';

let heatmapChartInstance = null;

export function updateHeatmap(filteredData) {
    const canvas = document.getElementById('bpHeatmap');
    if (!canvas) return;

    const allData = window.NORMALIZED_BP_DATA || [];
    
    const newestDateObj = allData.length > 0 
        ? new Date(Math.max(...allData.map(d => d.DateObj)))
        : new Date();
    newestDateObj.setHours(0,0,0,0);

    const filteredDateStrings = new Set(filteredData.map(r => r.Date.split(' ')[0]));

    const dailyData = {};
    allData.forEach(entry => {
        // Ensure we are splitting the string '2026-01-13 09:33:17' correctly
        const dateStr = entry.Date.split(' ')[0];
        if (!dailyData[dateStr]) dailyData[dateStr] = { maxScore: 0, readings: [] };
        
        dailyData[dateStr].readings.push(entry);
        
        if (entry.bpCat && entry.bpCat.score > dailyData[dateStr].maxScore) {
            dailyData[dateStr].maxScore = entry.bpCat.score;
        }
    });

    const fullDataset = [];
    for (let i = 0; i < 364; i++) {
        const d = new Date(newestDateObj);
        d.setDate(d.getDate() - i);
        d.setHours(0,0,0,0);

        const dateStr = d.toISOString().split('T')[0];
        const entry = dailyData[dateStr];

        fullDataset.push({
            x: d.getTime(), 
            y: d.getDay(),  
            v: entry ? entry.maxScore : 0,
            isFiltered: filteredDateStrings.has(dateStr),
            details: entry ? entry.readings : []
        });
    }

    if (heatmapChartInstance) heatmapChartInstance.destroy();

    heatmapChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'matrix',
        data: {
            datasets: [{
                data: fullDataset,
                borderRadius: 4,
                backgroundColor(context) {
                    const item = context.dataset.data[context.dataIndex];
                    if (!item || item.v === 0) return '#1e1e1e';
                    const level = Object.values(BP_LEVELS).find(l => l.score === item.v);
                    const baseColor = level ? level.color : '#1e1e1e';
                    return item.isFiltered ? baseColor : baseColor + '33'; 
                },
                borderWidth: 1,
                borderColor: '#1a1d21', // Keeps the "gap" looking like a grid
                width: ({chart}) => chart.chartArea ? (chart.chartArea.width / 53) - 1 : 10,
                height: ({chart}) => chart.chartArea ? (chart.chartArea.height / 7) - 1 : 10
            }]
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: false,
                    external: externalTooltipHandler 
                }
            },
            scales: {
                x: {
                    type: 'time',
                    reverse: true, 
                    time: {
                        unit: 'week',
                        round: 'week',
                        displayFormats: { week: 'MMM' }
                    },
                    grid: { display: false },
                    ticks: { color: '#666', font: { size: 9 }, maxRotation: 0 }
                },
                y: {
                    type: 'linear',
                    min: 0,
                    max: 6,
                    reverse: true,
                    ticks: {
                        stepSize: 1,
                        callback: (val) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][val],
                        color: '#666', 
                        font: { size: 9 }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

function externalTooltipHandler(context) {
    let tooltipEl = document.getElementById('chartjs-tooltip');
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'chartjs-tooltip';
        tooltipEl.style.background = 'rgba(0, 0, 0, 0.9)';
        tooltipEl.style.borderRadius = '4px';
        tooltipEl.style.color = 'white';
        tooltipEl.style.opacity = 1;
        tooltipEl.style.pointerEvents = 'none';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.padding = '8px';
        tooltipEl.style.zIndex = '1000';
        document.body.appendChild(tooltipEl);
    }

    const tooltipModel = context.tooltip;
    if (tooltipModel.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
    }

    if (tooltipModel.body) {
        const dataPoint = tooltipModel.dataPoints[0].raw;
        if (!dataPoint.details || dataPoint.details.length === 0) {
            tooltipEl.style.opacity = 0;
            return;
        }

        const d = new Date(dataPoint.x);
        const dateHead = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        let html = `<div style="font-weight:bold; color:#aaa; margin-bottom:5px; border-bottom:1px solid #444;">${dateHead}</div>`;
        
        dataPoint.details.forEach(r => {
            // FIX: Robust check for time and pulse
            const timeVal = r.Time || (r.Date ? r.Date.split(' ')[1] : '--:--');
            const pulseVal = r.Pulse || r.BPM || '--';
            
            html += `
                <div style="padding:4px 0; font-size:11px; line-height:1.4;">
                    <span style="color:${r.bpCat.color}">●</span> <b>${r.bpCat.label}</b><br>
                    ${r.Sys}/${r.Dia} <span style="color:#aaa;">(${pulseVal} bpm)</span> @ ${timeVal}
                </div>`;
        });
        tooltipEl.innerHTML = html;
    }

    const position = context.chart.canvas.getBoundingClientRect();
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
    tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY - 10 + 'px';
}

window.updateHeatmap = updateHeatmap;