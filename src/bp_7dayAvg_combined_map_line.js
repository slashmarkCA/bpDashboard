/* ============================================================================
   bp_7dayAvg_combined_map_line.js
   ---------------------------------------------------------------------------
   Mean Arterial Pressure (MAP) Line Chart
   - Daily MAP (per reading date)
   - True sliding 7-day rolling MAP average
   - Uses BOTH systolic + diastolic
   - ✅ FIXED: Rolling window now looks at full dataset history
   ============================================================================ */

console.log('bp_7dayAvg_combined_map_line.js loaded');

let map7DayChart = null;

function buildDailyMAP(bpData) {
    const byDay = new Map();

    bpData.forEach(r => {
        if (r.Sys == null || r.Dia == null || !(r.DateObj instanceof Date)) return;

        const d = new Date(
            r.DateObj.getFullYear(),
            r.DateObj.getMonth(),
            r.DateObj.getDate()
        );

        const key = d.getTime();
        const mapVal = calculateMAP(r.Sys, r.Dia);

        if (!byDay.has(key)) {
            byDay.set(key, { date: d, values: [] });
        }
        byDay.get(key).values.push(mapVal);
    });

    return Array.from(byDay.values())
        .map(d => ({
            date: d.date,
            map: d.values.reduce((a,b) => a + b, 0) / d.values.length
        }))
        .sort((a,b) => a.date - b.date);
}

function buildRolling7DayMAP(dailyMAP) {
    return dailyMAP.map(point => {
        const windowStart = new Date(point.date.getTime() - 6 * 86400000);

        const windowValues = dailyMAP
            .filter(p => p.date >= windowStart && p.date <= point.date)
            .map(p => p.map);

        const avg =
            windowValues.reduce((a,b) => a + b, 0) / windowValues.length;

        return {
            date: point.date,
            map: avg,
            windowDays: windowValues.length
        };
    });
}

function createMAP7DayChart(bpData) {
    const canvas = document.getElementById('map7DayChart');
    if (!canvas) {
        console.warn('map7DayChart canvas not found – chart skipped');
        return;
    }

    const ctx = canvas.getContext('2d');
    map7DayChart = destroyChart(map7DayChart);

    if (!bpData.length) return;

    // ✅ FIX: Calculate on full dataset, then filter for display
    const fullData = window.NORMALIZED_BP_DATA || [];

    // Step 1: Build daily MAP from ALL data
    const allDailyMAP = buildDailyMAP(fullData);

    // Step 2: Calculate rolling MAP on full history
    const allRollingMAP = buildRolling7DayMAP(allDailyMAP);

    // Step 3: Filter to match the date range of bpData
    const filteredDateKeys = new Set(
        bpData.map(r => new Date(
            r.DateObj.getFullYear(),
            r.DateObj.getMonth(),
            r.DateObj.getDate()
        ).getTime())
    );

    const dailyMAP = allDailyMAP.filter(d => filteredDateKeys.has(d.date.getTime()));
    const rollingMAP = allRollingMAP.filter(d => filteredDateKeys.has(d.date.getTime()));

    if (!dailyMAP.length) return;

    const dailyData = dailyMAP.map((d, i) => ({
        x: i,
        y: d.map,
        readingDate: d.date
    }));

    const rollingData = rollingMAP.map((d, i) => ({
        x: i,
        y: d.map,
        readingDate: d.date,
        windowDays: d.windowDays
    }));

    map7DayChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Daily MAP',
                    data: dailyData,
                    borderColor: '#4E79A7',
                    backgroundColor: '#4E79A7',
                    borderWidth: 1.5,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.2
                },
                {
                    label: '7-Day Rolling MAP',
                    data: rollingData,
                    borderColor: '#F28E2B',
                    backgroundColor: '#F28E2B',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.25
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
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        title: () => '',
                        label(ctx) {
                            const d = ctx.raw;
                            const prefix = ctx.dataset.label === 'Daily MAP' ? 'MAP' : '7-Day MAP';

                            const lines = [
                                `${prefix}: ${d.y.toFixed(1)}`,
                                `Date: ${formatTooltipDate(d.readingDate)}`
                            ];

                            // Show window size for rolling average
                            if (d.windowDays !== undefined) {
                                lines.push(`Window: ${d.windowDays} days`);
                            }

                            return lines;
                        }
                    },
                    displayColors: false
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: dailyMAP.length - 1,
                    ticks: {
                        callback(value) {
                            const i = Math.round(value);
                            if (!dailyMAP[i]) return '';

                            const total = dailyMAP.length;
                            let skip = 1;
                            if (total > 100) skip = 10;
                            else if (total > 50) skip = 5;
                            else if (total > 20) skip = 2;

                            return i % skip === 0 ? formatAxisDate(dailyMAP[i].date) : '';
                        },
                        maxRotation: 90,
                        minRotation: 90,
                        autoSkip: false,
                        font: { size: 10 }
                    },
                    grid: { display: false }
                },
                y: {
                    grid: { color: '#f0f0f0' },
                    title: {
                        display: true,
                        text: 'Mean Arterial Pressure (MAP)'
                    }
                }
            }
        }
    });
}

function updateMAP7DayChart(filteredData) {
    createMAP7DayChart(filteredData);
}