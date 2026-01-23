/* ============================================================================
   bp_categoryOverTime.js
   ---------------------------------------------------------------------------
   Blood Pressure Category Over Time
   - Clinical category logic (Normal → Crisis)
   - Stepped line (after)
   - Annotation background bands
   ============================================================================ */

console.log('bp_categoryOverTime.js loaded');

let categoryChart = null;

function getBPCategory(sys, dia) {
    if (sys >= 180 || dia >= 120) return 'Crisis';
    if (sys >= 140 || dia >= 90) return 'Stage 2';
    if (sys >= 130 || dia >= 80) return 'Stage 1';
    if (sys >= 120 && dia < 80) return 'Elevated';
    return 'Normal';
}

function getCategoryValue(category) {
    return {
        'Normal': 1,
        'Elevated': 2,
        'Stage 1': 3,
        'Stage 2': 4,
        'Crisis': 5
    }[category];
}

function getCategoryColor(category) {
    return {
        'Normal': '#4CAF50',
        'Elevated': '#FFC107',
        'Stage 1': '#FF9800',
        'Stage 2': '#F44336',
        'Crisis': '#9C27B0'
    }[category];
}

function createCategoryChart(bpData) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) {
        console.warn('categoryChart canvas not found – chart skipped');
        return;
    }

    const ctx = canvas.getContext('2d');
    categoryChart = destroyChart(categoryChart);

    const processed = bpData.map((r, i) => {
        const category = getBPCategory(r.Sys, r.Dia);
        return {
            x: i,
            y: getCategoryValue(category),
            category,
            color: getCategoryColor(category),
            reading: r
        };
    });

    if (!processed.length) return;

    categoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                data: processed,
                borderColor: '#333',
                borderWidth: 2.5,
                stepped: 'after',
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: processed.map(p => p.color),
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                tension: 0
            }]
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
                    backgroundColor: '#1e1e1e',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderWidth: 0,
                    displayColors: false,
                    callbacks: {
                        title: () => '',
                        label(context) {
                            const r = context.raw.reading;
                            return [
                                `Category: ${context.raw.category}`,
                                '',
                                `Sys: ${r.Sys}`,
                                `Dia: ${r.Dia}`,
                                `Date: ${formatTooltipDate(r.DateObj)}`,
                                `ReadingID: ${r.ReadingID}`
                            ];
                        }
                    }
                },
                annotation: {
                    annotations: {
                        normal:  { type:'box', yMin:0.5, yMax:1.5, backgroundColor:'rgba(76,175,80,0.10)', borderWidth:0 },
                        elevated:{ type:'box', yMin:1.5, yMax:2.5, backgroundColor:'rgba(255,193,7,0.10)', borderWidth:0 },
                        stage1:  { type:'box', yMin:2.5, yMax:3.5, backgroundColor:'rgba(255,152,0,0.10)', borderWidth:0 },
                        stage2:  { type:'box', yMin:3.5, yMax:4.5, backgroundColor:'rgba(244,67,54,0.10)', borderWidth:0 },
                        crisis:  { type:'box', yMin:4.5, yMax:5.5, backgroundColor:'rgba(156,39,176,0.10)', borderWidth:0 }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: processed.length - 1,
                    ticks: {
                        callback(value) {
                            const i = Math.round(value);
                            if (!processed[i]) return '';

                            const total = processed.length;
                            let skip = 1;
                            if (total > 100) skip = 10;
                            else if (total > 50) skip = 5;
                            else if (total > 20) skip = 2;

                            return i % skip === 0 ? formatAxisDate(processed[i].reading.DateObj) : '';
                        },
                        maxRotation: 90,
                        minRotation: 90,
                        autoSkip: false,
                        font: { size: 10 }
                    },
                    grid: { display: false }
                },
                y: {
                    min: 0.5,
                    max: 5.5,
                    ticks: {
                        stepSize: 1,
                        callback(value) {
                            return {
                                1:'Normal',
                                2:'Elevated',
                                3:'Stage 1',
                                4:'Stage 2',
                                5:'Crisis'
                            }[value] || '';
                        }
                    },
                    grid: { color: '#f0f0f0', drawTicks: false },
                    title: {
                        display: true,
                        text: 'Blood Pressure Category'
                    }
                }
            }
        }
    });
}

function updateCategoryChart(filteredData) {
    createCategoryChart(filteredData);
}