/* ============================================================================
   bp_heatmap.js
   ---------------------------------------------------------------------------
   Blood Pressure Calendar Heatmap (GitHub-style)
   - Shows daily BP readings colored by category
   - Responsive touch/mobile support
   - 10.5 month rolling window
   ============================================================================ */

import { BP_LEVELS, destroyChart } from '../utils/bp_utils.js';

let heatmapChart = null;

/**
 * Creates the BP heatmap visualization
 * @param {Array} filteredData - Filtered BP readings
 */
export function createHeatmap(filteredData) {
    const canvas = document.getElementById('bpHeatmap');
    if (!canvas) {
        console.error('[HEATMAP] Canvas element #bpHeatmap not found');
        return;
    }

    // Destroy existing chart (though heatmap is canvas-based, not Chart.js)
    heatmapChart = destroyChart(heatmapChart);

    // Validate data context exists
    if (!filteredData) {
        console.error('[HEATMAP] Data context missing');
        return;
    }

    const allData = window.NORMALIZED_BP_DATA || [];
    
    // Determine date range (52 weeks from newest reading)
    const newestDateObj = allData.length > 0 
        ? new Date(Math.max(...allData.map(d => d.DateObj)))
        : new Date();
    newestDateObj.setHours(0, 0, 0, 0);

    const filteredDateStrings = new Set(filteredData.map(r => r.Date.split(' ')[0]));

    // Aggregate daily data (max BP score per day)
    const dailyData = {};
    allData.forEach(entry => {
        const dateStr = entry.Date.split(' ')[0];
        if (!dailyData[dateStr]) {
            dailyData[dateStr] = { maxScore: 0, readings: [] };
        }
        dailyData[dateStr].readings.push(entry);
        
        if (entry.bpCat && entry.bpCat.score > dailyData[dateStr].maxScore) {
            dailyData[dateStr].maxScore = entry.bpCat.score;
        }
    });

    // Build 10.5-month dataset (46 weeks)
    const weeks = [];
    const startDate = new Date(newestDateObj);
    startDate.setDate(startDate.getDate() - 322); // ~46 weeks
    
    // Align to Sunday (start of week)
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek !== 0) {
        startDate.setDate(startDate.getDate() - dayOfWeek);
    }
    
    // Calculate how many weeks we need
    const totalDays = Math.ceil((newestDateObj - startDate) / (24 * 60 * 60 * 1000)) + 1;
    const maxWeeks = Math.ceil(totalDays / 7);
     
    for (let weekIdx = 0; weekIdx < maxWeeks; weekIdx++) {
        const weekData = [];
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + (weekIdx * 7) + dayIdx);
            d.setHours(0, 0, 0, 0);
            
            const dateStr = d.toISOString().split('T')[0];
            const entry = dailyData[dateStr];
            
            // Don't render future dates
            const isFuture = d > newestDateObj;
            
            weekData.push({
                date: d,
                dateStr: dateStr,
                value: entry ? entry.maxScore : 0,
                isFiltered: filteredDateStrings.has(dateStr),
                readings: entry ? entry.readings : [],
                isFuture: isFuture
            });
        }
        weeks.push(weekData);
        
        // Stop if we've passed the newest date
        if (weekData[6].date >= newestDateObj) {
            break;
        }
    }
    
    // Reverse so newest dates appear on the LEFT (better for mobile)
    weeks.reverse();
    
    drawHeatmap(canvas, weeks, newestDateObj);
    console.log('[Trace] bp_heatmap.js rendered successfully');
}

/**
 * Draws the heatmap on canvas
 */
function drawHeatmap(canvas, weeks, newestDate) {
    const ctx = canvas.getContext('2d');
    
    // Get parent container dimensions
    const container = canvas.parentElement;
    const containerStyle = window.getComputedStyle(container);
    const containerWidth = container.clientWidth || parseInt(containerStyle.width);
    const containerHeight = parseInt(containerStyle.height) || 180;
    
    // Configuration
    const leftPadding = 30;
    const topPadding = 20;
    const bottomPadding = 5;
    const rightPadding = 5;
    
    // Set canvas size
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    // Calculate available space
    const availableWidth = containerWidth - leftPadding - rightPadding;
    const availableHeight = containerHeight - topPadding - bottomPadding;
    
    // Calculate cell size
    const cellGap = 2;
    const cellWidth = Math.floor((availableWidth - (weeks.length * cellGap)) / weeks.length);
    const cellHeight = Math.floor((availableHeight - (7 * cellGap)) / 7);
    const cellSize = Math.min(cellWidth, cellHeight);
        
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw month labels
    drawMonthLabels(ctx, weeks, cellSize, cellGap, leftPadding, topPadding);
    
    // Draw day labels
    drawDayLabels(ctx, cellSize, cellGap, leftPadding, topPadding);
    
    // Draw heatmap cells
    weeks.forEach((week, weekIdx) => {
        week.forEach((day, dayIdx) => {
            const x = leftPadding + (weekIdx * (cellSize + cellGap));
            const y = topPadding + (dayIdx * (cellSize + cellGap));
            
            // Determine cell color
            let color = '#ebedf0';
            let opacity = 1;
            
            if (day.isFuture) {
                opacity = 0;
            } else if (day.value > 0) {
                const level = Object.values(BP_LEVELS).find(l => l.score === day.value);
                if (level) {
                    color = day.isFiltered ? level.color : level.color + '33';
                }
            }
            
            ctx.globalAlpha = opacity;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.globalAlpha = 1;
        });
    });
    
    // Setup hover interaction
    setupHoverInteraction(canvas, weeks, cellSize, cellGap, leftPadding, topPadding);
}

function drawMonthLabels(ctx, weeks, cellSize, cellGap, leftPadding, topPadding) {
    ctx.font = '9px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'left';
    
    let lastMonth = -1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    weeks.forEach((week, weekIdx) => {
        const firstDay = week[0].date;
        const month = firstDay.getMonth();
        
        if (month !== lastMonth && weekIdx > 0) {
            const x = leftPadding + (weekIdx * (cellSize + cellGap));
            ctx.fillText(monthNames[month], x, topPadding - 6);
            lastMonth = month;
        }
    });
}

function drawDayLabels(ctx, cellSize, cellGap, leftPadding, topPadding) {
    ctx.font = '9px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Only show Mon, Wed, Fri
    [1, 3, 5].forEach(dayIdx => {
        const y = topPadding + (dayIdx * (cellSize + cellGap)) + (cellSize / 2);
        ctx.fillText(dayLabels[dayIdx], leftPadding - 5, y);
    });
}

function setupHoverInteraction(canvas, weeks, cellSize, cellGap, leftPadding, topPadding) {
    let tooltipEl = document.getElementById('chartjs-tooltip');
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'chartjs-tooltip';
        tooltipEl.style.cssText = `
            position: fixed;
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid #ccc;
            border-radius: 4px;
            color: #333;
            opacity: 0;
            pointer-events: none;
            padding: 8px;
            z-index: 10000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-size: 12px;
            transition: opacity 0.15s;
            max-width: 250px;
        `;
        document.body.appendChild(tooltipEl);
    }
    
    const handleInteraction = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        const weekIdx = Math.floor((x - leftPadding) / (cellSize + cellGap));
        const dayIdx = Math.floor((y - topPadding) / (cellSize + cellGap));
        
        if (weekIdx >= 0 && weekIdx < weeks.length && dayIdx >= 0 && dayIdx < 7) {
            const day = weeks[weekIdx][dayIdx];
            
            if (!day.isFuture && day.readings.length > 0) {
                showTooltip(tooltipEl, day, clientX, clientY);
                canvas.style.cursor = 'pointer';
                return true;
            }
        }
        
        hideTooltip(tooltipEl);
        canvas.style.cursor = 'default';
        return false;
    };
    
    // Mouse events
    canvas.addEventListener('mousemove', (e) => {
        handleInteraction(e.clientX, e.clientY);
    });
    
    canvas.addEventListener('mouseleave', () => {
        hideTooltip(tooltipEl);
        canvas.style.cursor = 'default';
    });
    
    // Touch events
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleInteraction(touch.clientX, touch.clientY);
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleInteraction(touch.clientX, touch.clientY);
    });
    
    canvas.addEventListener('touchend', () => {
        setTimeout(() => hideTooltip(tooltipEl), 2000);
    });
}

function showTooltip(tooltipEl, day, clientX, clientY) {
    const dateHead = day.date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    let html = `<div style="font-weight:bold; color:#666; margin-bottom:5px; border-bottom:1px solid #eee;">${dateHead}</div>`;
    
    day.readings.forEach(r => {
        const timeVal = r.Time || (r.Date ? r.Date.split(' ')[1] : '--:--');
        const pulseVal = r.Pulse || r.BPM || '--';
        
        html += `
            <div style="padding:4px 0; font-size:11px; line-height:1.4;">
                <span style="color:${r.bpCat.color}">●</span> <b>${r.bpCat.label}</b><br>
                ${r.Sys}/${r.Dia} <span style="color:#888;">(${pulseVal} bpm)</span> @ ${timeVal}
            </div>`;
    });
    
    tooltipEl.innerHTML = html;
    tooltipEl.style.opacity = '1';
    tooltipEl.style.position = 'fixed';
    
    // Position tooltip
    const tooltipWidth = tooltipEl.offsetWidth || 200;
    const tooltipHeight = tooltipEl.offsetHeight || 100;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = clientX + 10;
    let top = clientY - 10;
    
    if (left + tooltipWidth > viewportWidth) {
        left = clientX - tooltipWidth - 10;
    }
    
    if (top + tooltipHeight > viewportHeight) {
        top = clientY - tooltipHeight - 10;
    }
    
    if (left < 10) left = 10;
    if (top < 10) top = clientY + 10;
    
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
}

function hideTooltip(tooltipEl) {
    tooltipEl.style.opacity = '0';
}