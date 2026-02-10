/* ============================================================================
   bp_heatmap.js - FIXED VERSION
   ---------------------------------------------------------------------------
   Blood Pressure Calendar Heatmap (GitHub-style)
   - Fixed height management to prevent blowout
   - Proper canvas sizing
   - Responsive touch/mobile support
   ============================================================================ */

import { BP_LEVELS, destroyChart } from '../utils/bp_utils.js';

let heatmapChart = null;

export function createHeatmap(filteredData) {
    const canvas = document.getElementById('bpHeatmap');
    if (!canvas) {
        console.error('[HEATMAP] Canvas element #bpHeatmap not found');
        return;
    }

    heatmapChart = destroyChart(heatmapChart);

    if (!filteredData) {
        console.error('[HEATMAP] Data context missing');
        return;
    }

    const allData = window.NORMALIZED_BP_DATA || [];
    
    const newestDateObj = allData.length > 0 
        ? new Date(Math.max(...allData.map(d => d.DateObj)))
        : new Date();
    newestDateObj.setHours(0, 0, 0, 0);

    const filteredDateStrings = new Set(filteredData.map(r => r.Date.split(' ')[0]));

    // Aggregate daily data
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

    // Build weeks data
    const weeks = [];
    const startDate = new Date(newestDateObj);
    startDate.setDate(startDate.getDate() - 322);
    
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek !== 0) {
        startDate.setDate(startDate.getDate() - dayOfWeek);
    }
    
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
        
        if (weekData[6].date >= newestDateObj) {
            break;
        }
    }
    
    weeks.reverse();
    
    drawHeatmap(canvas, weeks, newestDateObj);
    console.log('[Trace] bp_heatmap.js rendered successfully');
}

/**
 * FIXED: Draws the heatmap with proper height management
 */
function drawHeatmap(canvas, weeks, newestDate) {
    const ctx = canvas.getContext('2d');
    
    // FIX: Get parent dimensions - use scroll-area as the constraint
    const scrollArea = canvas.parentElement;
    const wrapper = scrollArea.parentElement;
    
    // FIX: Use getComputedStyle to get actual rendered dimensions
    const scrollStyle = window.getComputedStyle(scrollArea);
    const wrapperStyle = window.getComputedStyle(wrapper);
    
    // FIX: Use clientHeight (excludes scrollbars) instead of offsetHeight
    const containerHeight = scrollArea.clientHeight;
    const containerWidth = scrollArea.clientWidth;
    
    // Configuration
    const leftPadding = 30;
    const topPadding = 20;
    const bottomPadding = 5;
    const rightPadding = 5;
    
    // FIX: Set canvas size EXACTLY to container
    // Use device pixel ratio for sharp rendering on high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    
    // Set display size (CSS pixels)
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';
    
    // Set actual size in memory (scaled for DPI)
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    
    // Scale context to account for DPI
    ctx.scale(dpr, dpr);
    
    // Calculate available space (using CSS pixels)
    const availableWidth = containerWidth - leftPadding - rightPadding;
    const availableHeight = containerHeight - topPadding - bottomPadding;
    
    // Calculate cell size
    const cellGap = 2;
    const cellWidth = Math.floor((availableWidth - (weeks.length * cellGap)) / weeks.length);
    const cellHeight = Math.floor((availableHeight - (7 * cellGap)) / 7);
    const cellSize = Math.min(cellWidth, cellHeight);
        
    ctx.clearRect(0, 0, containerWidth, containerHeight);
    
    // Draw components
    drawMonthLabels(ctx, weeks, cellSize, cellGap, leftPadding, topPadding);
    drawDayLabels(ctx, cellSize, cellGap, leftPadding, topPadding);
    
    // Draw cells
    weeks.forEach((week, weekIdx) => {
        week.forEach((day, dayIdx) => {
            const x = leftPadding + (weekIdx * (cellSize + cellGap));
            const y = topPadding + (dayIdx * (cellSize + cellGap));
            
            let color = '#282d35';
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
    
    canvas.addEventListener('mousemove', (e) => {
        handleInteraction(e.clientX, e.clientY);
    });
    
    canvas.addEventListener('mouseleave', () => {
        hideTooltip(tooltipEl);
        canvas.style.cursor = 'default';
    });
    
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