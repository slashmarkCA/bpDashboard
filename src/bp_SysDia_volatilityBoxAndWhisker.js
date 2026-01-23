// bp_SysDia_volatilityBoxAndWhisker.js
// ============================================================
// Sys/Dia Volatility - Final Minimalist & Precise Ticks
// ============================================================

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

    if (filter === 'all') {
        const months = new Map();
        sorted.forEach(r => {
            const mKey = r.DateObj.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
            if (!months.has(mKey)) months.set(mKey, { sys: [], dia: [] });
            months.get(mKey).sys.push(r.Sys);
            months.get(mKey).dia.push(r.Dia);
        });
        months.forEach((val, key) => {
            labels.push(key);
            dateRanges.push(`Full Month: ${key}`);
            sysData.push(val.sys);
            diaData.push(val.dia);
        });
    } else {
        const numChunks = filter === 'last7days' ? 1 : (filter === 'last14days' ? 2 : 4);
        const chunkSize = Math.ceil(sorted.length / numChunks);

        for (let i = 0; i < numChunks; i++) {
            const chunk = sorted.slice(i * chunkSize, (i + 1) * chunkSize);
            if (chunk.length === 0) continue;
            const start = chunk[0].DateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const end = chunk[chunk.length - 1].DateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            labels.push(`Bucket ${i + 1}`);
            dateRanges.push(`${start} - ${end}`);
            sysData.push(chunk.map(r => r.Sys));
            diaData.push(chunk.map(r => r.Dia));
        }
    }
    return { labels, sysData, diaData, dateRanges };
}

var updateBoxWhiskerChart = function(filteredData) {
    createBoxWhiskerChart(filteredData);
};