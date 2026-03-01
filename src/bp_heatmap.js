/* ============================================================================
   bp_heatmap.js - COMPLETE FIXED VERSION
   ---------------------------------------------------------------------------
   Blood Pressure Calendar Heatmap (GitHub-style)
   - Shows daily BP readings colored by category
   - Responsive touch/mobile support
   - 10.5 month rolling window
   - Fixed height management for desktop and mobile
   ============================================================================ */

/* ============================================================================
   bp_heatmap.js
   ---------------------------------------------------------------------------
   Blood Pressure Calendar Heatmap (GitHub-style)
   - Shows daily BP readings colored by category
   - Responsive touch/mobile support
   - 10.5 month rolling window
   - Fixed height management for desktop and mobile

   DATE HANDLING NOTES (important - do not regress):
   -------------------------------------------------
   All date keys in this file use getLocalDateKey(r.DateObj) from bp_utils.js.
   This uses getFullYear/getMonth/getDate (local time components), NOT ISO string
   conversion or r.Date.split(' ')[0] from the raw JSON field.

   WHY: Readings taken close to midnight in EST (GMT-5) would produce the WRONG
   date if converted via toISOString() or new Date(str) because JS Date internals
   are UTC. A reading at "2026-02-27 11:45:00 PM" EST is still Feb 27 locally,
   but ISO conversion shifts it to Feb 28 UTC.

   THE PIPELINE:
     Google Sheet → Apps Script ETL → GitHub /data/bp_readings.json
     JSON "Date" field format: "YYYY-MM-DD HH:MM:SS AM/PM"  e.g. "2025-07-24 05:00:01 PM"
     bp_data_normalized.js parses this into DateObj (local Date object)
     All downstream code (filters, charts, table, heatmap) must use DateObj only.

   THE STANDARD: getLocalDateKey(dateObj) → "YYYY-MM-DD" (locale-safe)
   See also: bp_filters.js toDayKey(), bp_rawDataTabularView.js grouping logic.
   ============================================================================ */

import { BP_LEVELS, destroyChart, getCssStyles, getLocalDateKey } from '../utils/bp_utils.js';

let heatmapChart = null;
const cssStyle = getCssStyles("dark", "chart");

/**
 * Helper function to detect mobile
 */
function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * Creates the BP heatmap visualization
 * @param {Array} filteredData - Filtered BP readings (used to dim/highlight cells)
 */
export function createHeatmap(filteredData) {
    const canvas = document.getElementById('bpHeatmap');
    if (!canvas) {
        console.error('[HEATMAP] Canvas element #bpHeatmap not found');
        return;
    }

    // Destroy existing chart
    heatmapChart = destroyChart(heatmapChart);

    // Validate data context exists
    if (!filteredData) {
        console.error('[HEATMAP] Data context missing');
        return;
    }

    const allData = window.NORMALIZED_BP_DATA || [];
    
    // Determine date range (52 weeks back from newest reading)
    const newestDateObj = allData.length > 0 
        ? new Date(Math.max(...allData.map(d => d.DateObj)))
        : new Date();
    newestDateObj.setHours(0, 0, 0, 0);

    // Build set of filtered day keys using locale-safe key (not r.Date string split).
    // This must match the grid cell keys built below, both using getLocalDateKey().
    const filteredDateStrings = new Set(filteredData.map(r => getLocalDateKey(r.DateObj)));

    // Aggregate daily data (max BP score per day).
    // Key by locale-safe YYYY-MM-DD so late-night readings aren't shifted to next day.
    const dailyData = {};
    allData.forEach(entry => {
        const dateStr = getLocalDateKey(entry.DateObj); // locale-safe, matches grid keys below
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
    startDate.setDate(startDate.getDate() - 322); // ~46 weeks back
    
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

            // Build grid cell key using local date components - same method as dailyData
            // keys above and filteredDateStrings. All three must be consistent.
            const dateStr = getLocalDateKey(d);
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
    
    // Reverse so newest dates appear on the LEFT (better for mobile scrolling)
    weeks.reverse();
    
    drawHeatmap(canvas, weeks, newestDateObj);
    
    // Add resize handler for responsiveness
    let resizeTimeout;
    const resizeHandler = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            drawHeatmap(canvas, weeks, newestDateObj);
        }, 250);
    };
    
    // Remove old listener if it exists before adding new one
    window.removeEventListener('resize', resizeHandler);
    window.addEventListener('resize', resizeHandler);
    
    console.log('[Trace] bp_heatmap.js rendered successfully');
}

/**
 * Draws the heatmap on canvas
 */
function drawHeatmap(canvas, weeks, newestDate) {
    const ctx = canvas.getContext('2d');
    
    // Get parent dimensions - FIXED for mobile
    const scrollArea = canvas.parentElement; // .heatmap-scroll-area
    const wrapper = scrollArea.parentElement; // .heatmap-wrapper
    
    let containerHeight, containerWidth;
    
    if (isMobile()) {
        // Mobile: Use wrapper's explicit height from CSS
        containerHeight = wrapper.clientHeight || 180;
        containerWidth = scrollArea.scrollWidth || 700;
    } else {
        // Desktop: Use scrollArea dimensions
        containerHeight = scrollArea.clientHeight || 155;
        containerWidth = scrollArea.clientWidth || 600;
    }
    
    // Configuration - adjust padding for mobile
    const leftPadding = isMobile() ? 25 : 30;
    const topPadding = isMobile() ? 15 : 20;
    const bottomPadding = 5;
    const rightPadding = 5;
    
    // Device pixel ratio for sharp rendering on hi-DPI screens
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas display size (CSS pixels)
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';
    canvas.style.display = 'block';
    
    // Set actual backing size in memory (scaled for DPI)
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    
    // Scale context to account for DPI
    ctx.scale(dpr, dpr);
    
    // Calculate available space
    const availableWidth = containerWidth - leftPadding - rightPadding;
    const availableHeight = containerHeight - topPadding - bottomPadding;
    
    // Calculate cell size to fill available space
    const cellGap = isMobile() ? 1 : 2;
    const cellWidth = Math.floor((availableWidth - (weeks.length * cellGap)) / weeks.length);
    const cellHeight = Math.floor((availableHeight - (7 * cellGap)) / 7);
    const cellSize = Math.min(cellWidth, cellHeight);
    
    if (isMobile()) {
        console.log('[HEATMAP] Mobile dimensions:', {
            containerHeight,
            containerWidth,
            cellSize,
            weeks: weeks.length
        });
    }
        
    ctx.clearRect(0, 0, containerWidth, containerHeight);
    
    // Draw month labels
    drawMonthLabels(ctx, weeks, cellSize, cellGap, leftPadding, topPadding);
    
    // Draw day labels
    drawDayLabels(ctx, cellSize, cellGap, leftPadding, topPadding);
    
    // Draw heatmap cells
    weeks.forEach((week, weekIdx) => {
        week.forEach((day, dayIdx) => {
            const x = leftPadding + (weekIdx * (cellSize + cellGap));
            const y = topPadding + (dayIdx * (cellSize + cellGap));
            
            // Determine cell color based on BP category score
            let color = '#282d35'; // empty/no-data color
            let opacity = 1;
            
            if (day.isFuture) {
                opacity = 0; // hide future cells
            } else if (day.value > 0) {
                const level = Object.values(BP_LEVELS).find(l => l.score === day.value);
                if (level) {
                    // Full color if in current filter window, dimmed (33 = ~20% alpha) if outside
                    color = day.isFiltered ? level.color : level.color + '33';
                }
            }
            
            ctx.globalAlpha = opacity;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.globalAlpha = 1;
        });
    });
    
    // Setup hover/touch interaction
    setupHoverInteraction(canvas, weeks, cellSize, cellGap, leftPadding, topPadding);
}

/**
 * Draws month labels at the top of the heatmap
 */
function drawMonthLabels(ctx, weeks, cellSize, cellGap, leftPadding, topPadding) {
    ctx.font = `${cssStyle.weight} ${cssStyle.size} ${cssStyle.family}`;
    ctx.fillStyle = `${cssStyle.color}`;
    ctx.textAlign = 'left';
    
    let lastMonth = -1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    weeks.forEach((week, weekIdx) => {
        // Use local getMonth() - date objects in weeks[] are constructed with local midnight
        const firstDay = week[0].date;
        const month = firstDay.getMonth();
        
        if (month !== lastMonth && weekIdx > 0) {
            const x = leftPadding + (weekIdx * (cellSize + cellGap));
            ctx.fillText(monthNames[month], x, topPadding - 6);
            lastMonth = month;
        }
    });
}

/**
 * Draws day-of-week labels on the left side
 */
function drawDayLabels(ctx, cellSize, cellGap, leftPadding, topPadding) {
    ctx.font = `${cssStyle.weight} ${cssStyle.size} ${cssStyle.family}`;
    ctx.fillStyle = `${cssStyle.color}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Only show Mon, Wed, Fri to keep labels sparse
    [1, 3, 5].forEach(dayIdx => {
        const y = topPadding + (dayIdx * (cellSize + cellGap)) + (cellSize / 2);
        ctx.fillText(dayLabels[dayIdx], leftPadding - 5, y);
    });
}

/**
 * Sets up hover and touch interactions for the heatmap canvas.
 * Tooltips are disabled on mobile to allow smooth horizontal scrolling.
 */
function setupHoverInteraction(canvas, weeks, cellSize, cellGap, leftPadding, topPadding) {
    // Disable tooltips on mobile - allows smooth horizontal scrolling
    if (window.innerWidth <= 768) {
        return;
    }
    
    let tooltipEl = document.getElementById('chartjs-tooltip');
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'chartjs-tooltip';
        tooltipEl.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.95);
            border-radius: 4px;
            color: #ffffff;
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

/**
 * Shows tooltip with reading details for a hovered heatmap cell.
 * Uses day.date (local Date object) for the header - NOT r.Date string.
 */
function showTooltip(tooltipEl, day, clientX, clientY) {
    // toLocaleDateString() is safe here - day.date is constructed with local midnight (setHours(0,0,0,0))
    const dateHead = day.date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    let html = `<div style="color:#ffffff; margin-bottom:5px;">${dateHead}</div>`;
    
    day.readings.forEach(r => {
        // Use DateObj for time display - NOT r.Date string split.
        // r.DateObj is the normalized local Date object from bp_data_normalized.js.
        const timeVal = r.DateObj instanceof Date
            ? r.DateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--:--';
        const pulseVal = r.BPM || '--';
        
        html += `
            <div style="padding:4px 0; font-size:11px; line-height:1.4; font-weight: normal;">
                <span style="color:${r.bpCat.color}">●</span> ${r.bpCat.label}<br>
                ${r.Sys}/${r.Dia} <span style="color:#888;">(${pulseVal} bpm)</span> @ ${timeVal}
            </div>`;
    });
    
    tooltipEl.innerHTML = html;
    tooltipEl.style.opacity = '1';
    tooltipEl.style.position = 'fixed';
    
    // Position tooltip - keep within viewport
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

/**
 * Hides the tooltip
 */
function hideTooltip(tooltipEl) {
    tooltipEl.style.opacity = '0';
}