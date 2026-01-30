// VERSION 2.1 - 2026-01-29 - Fixed missing final week, future dates, and canvas sizing
import { BP_LEVELS } from '../utils/bp_utils.js';

let currentTooltip = null;

export function updateHeatmap(filteredData) {
    console.log('🔥 HEATMAP VERSION 2.1 LOADED');
    const canvas = document.getElementById('bpHeatmap');
    if (!canvas) return;

    const allData = window.NORMALIZED_BP_DATA || [];
    
    // Determine date range (52 weeks from newest reading)
    const newestDateObj = allData.length > 0 
        ? new Date(Math.max(...allData.map(d => d.DateObj)))
        : new Date();
    newestDateObj.setHours(0, 0, 0, 0);
    
    console.log('📅 Latest date in dataset:', newestDateObj.toISOString().split('T')[0]);

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

    // Build 10.5-month dataset (46 weeks) - adjusted to add 2 more weeks
    const weeks = [];
    const startDate = new Date(newestDateObj);
    startDate.setDate(startDate.getDate() - 322); // ~46 weeks (added 2 weeks)
    
    // Align to Sunday (start of week)
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek !== 0) {
        startDate.setDate(startDate.getDate() - dayOfWeek);
    }
    
    // Calculate how many weeks we need (including partial final week)
    // We want ~12 months, so go back about 370 days from newest
    const totalDays = Math.ceil((newestDateObj - startDate) / (24 * 60 * 60 * 1000)) + 1;
    const maxWeeks = Math.ceil(totalDays / 7);
    
    console.log('📊 Start date:', startDate.toISOString().split('T')[0]);
    console.log('📊 End date:', newestDateObj.toISOString().split('T')[0]);
    console.log('📊 Total days:', totalDays);
    console.log('📊 Max weeks:', maxWeeks);
    
    for (let weekIdx = 0; weekIdx < maxWeeks; weekIdx++) {
        const weekData = [];
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + (weekIdx * 7) + dayIdx);
            d.setHours(0, 0, 0, 0);
            
            const dateStr = d.toISOString().split('T')[0];
            const entry = dailyData[dateStr];
            
            // Don't render future dates (dates after newestDateObj)
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
        
        // Stop if we've passed the newest date (optimization)
        if (weekData[6].date >= newestDateObj) {
            break;
        }
    }
    
    // Reverse so newest dates appear on the LEFT (better for mobile - no scrolling needed)
    weeks.reverse();
    
    console.log('📊 First week (LEFT/newest) starts:', weeks[0][0].dateStr);
    console.log('📊 Last week (RIGHT/oldest) ends:', weeks[weeks.length - 1][6].dateStr);
    console.log('📊 Total weeks generated:', weeks.length);

    drawHeatmap(canvas, weeks, newestDateObj);
}

function drawHeatmap(canvas, weeks, newestDate) {
    const ctx = canvas.getContext('2d');
    
    // Get parent container dimensions
    const container = canvas.parentElement;
    
    // Use computed style to get the actual dimensions including CSS height
    const containerStyle = window.getComputedStyle(container);
    const containerWidth = container.clientWidth || parseInt(containerStyle.width);
    const containerHeight = parseInt(containerStyle.height) || 180; // Fallback to 180px
    
    // Configuration
    const leftPadding = 30;  // Space for day labels
    const topPadding = 20;   // Space for month labels
    const bottomPadding = 5;
    const rightPadding = 5;
    
    // Set canvas size to fill container FIRST
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    // Calculate available space for grid
    const availableWidth = containerWidth - leftPadding - rightPadding;
    const availableHeight = containerHeight - topPadding - bottomPadding;
    
    // Calculate cell size to fit the space (cells should FILL the available area)
    const cellGap = 2;
    const cellWidth = Math.floor((availableWidth - (weeks.length * cellGap)) / weeks.length);
    const cellHeight = Math.floor((availableHeight - (7 * cellGap)) / 7);
    const cellSize = Math.min(cellWidth, cellHeight); // Keep squares square
    
    console.log('🎨 Container dimensions:', containerWidth, 'x', containerHeight);
    console.log('🎨 Available space:', availableWidth, 'x', availableHeight);
    console.log('🎨 Cell size:', cellSize, 'Gap:', cellGap);
    console.log('🎨 Drawing', weeks.length, 'weeks');
    console.log('🎨 Drawing', weeks.length, 'weeks');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw month labels at top
    drawMonthLabels(ctx, weeks, cellSize, cellGap, leftPadding, topPadding);
    
    // Draw day labels on left
    drawDayLabels(ctx, cellSize, cellGap, leftPadding, topPadding);
    
    // Draw the heatmap cells
    weeks.forEach((week, weekIdx) => {
        week.forEach((day, dayIdx) => {
            const x = leftPadding + (weekIdx * (cellSize + cellGap));
            const y = topPadding + (dayIdx * (cellSize + cellGap));
            
            // Determine cell color
            let color = '#ebedf0'; // Default empty color (GitHub style)
            let opacity = 1;
            
            if (day.isFuture) {
                // Future dates: completely transparent to not show
                opacity = 0;
            } else if (day.value > 0) {
                const level = Object.values(BP_LEVELS).find(l => l.score === day.value);
                if (level) {
                    color = day.isFiltered ? level.color : level.color + '33'; // Add transparency if not filtered
                }
            }
            
            // Draw cell
            ctx.globalAlpha = opacity;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, cellSize, cellSize);
            
            // No border - let the cellGap spacing show through to wrapper background
            ctx.globalAlpha = 1; // Reset alpha
        });
    });
    
    // Set up hover interaction
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
        
        // Only draw label when month changes AND it's not the first week (which might be partial)
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
    
    // Only show Mon, Wed, Fri to reduce clutter (GitHub style)
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
    
    // Unified handler for both mouse and touch
    const handleInteraction = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // Find which cell we're hovering over
        const weekIdx = Math.floor((x - leftPadding) / (cellSize + cellGap));
        const dayIdx = Math.floor((y - topPadding) / (cellSize + cellGap));
        
        if (weekIdx >= 0 && weekIdx < weeks.length && dayIdx >= 0 && dayIdx < 7) {
            const day = weeks[weekIdx][dayIdx];
            
            // Don't show tooltip for future dates or empty days
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
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling when touching the canvas
        const touch = e.touches[0];
        handleInteraction(touch.clientX, touch.clientY);
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleInteraction(touch.clientX, touch.clientY);
    });
    
    canvas.addEventListener('touchend', () => {
        // Keep tooltip visible for a moment after touch ends
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
    
    // Use fixed positioning for more reliable placement on mobile
    tooltipEl.style.position = 'fixed';
    
    // Position tooltip, ensuring it stays on screen
    const tooltipWidth = tooltipEl.offsetWidth || 200;
    const tooltipHeight = tooltipEl.offsetHeight || 100;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = clientX + 10;
    let top = clientY - 10;
    
    // Keep tooltip on screen horizontally
    if (left + tooltipWidth > viewportWidth) {
        left = clientX - tooltipWidth - 10;
    }
    
    // Keep tooltip on screen vertically
    if (top + tooltipHeight > viewportHeight) {
        top = clientY - tooltipHeight - 10;
    }
    
    // Don't let it go off the left edge
    if (left < 10) {
        left = 10;
    }
    
    // Don't let it go off the top edge
    if (top < 10) {
        top = clientY + 10;
    }
    
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
}

function hideTooltip(tooltipEl) {
    tooltipEl.style.opacity = '0';
}

window.updateHeatmap = updateHeatmap;

// Cache-busting verification
const loadTime = new Date();
console.log('✅ bp_heatmap.js v2.1 loaded at:', loadTime.toString());