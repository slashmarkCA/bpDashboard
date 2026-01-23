/* ============================================================================
   bp_utils.js
   ---------------------------------------------------------------------------
   Shared utilities for Blood Pressure Dashboard
   - Date formatting (axis & tooltips)
   - Chart lifecycle management
   - Common calculations
   ============================================================================ */

console.log('[UTILS] bp_utils.js loaded');

/* ---------------------------------------------------------------------------
   Date Formatting
--------------------------------------------------------------------------- */

/**
 * Format date for chart x-axis (DD-MMM format)
 * @param {Date} dateObj
 * @returns {string} e.g., "17-Jan"
 */
function formatAxisDate(dateObj) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${day}-${months[dateObj.getMonth()]}`;
}

/**
 * Format date for tooltips (full datetime with AM/PM)
 * @param {Date} dateObj
 * @returns {string} e.g., "January 17, 2026 9:33:17 pm"
 */
function formatTooltipDate(dateObj) {
    const months = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];

    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;

    return `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()} ${hours}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Get local date key (YYYY-MM-DD) without UTC conversion
 * @param {Date} dateObj
 * @returns {string} e.g., "2026-01-17"
 */
function getLocalDateKey(dateObj) {
    if (!(dateObj instanceof Date)) return null;
    return (
        dateObj.getFullYear() + '-' +
        String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
        String(dateObj.getDate()).padStart(2, '0')
    );
}

/* ---------------------------------------------------------------------------
   Chart Lifecycle Management
--------------------------------------------------------------------------- */

/**
 * Safely destroy a Chart.js instance
 * @param {Chart|null} chartInstance
 * @returns {null}
 */
function destroyChart(chartInstance) {
    if (chartInstance) {
        chartInstance.destroy();
    }
    return null;
}

/* ---------------------------------------------------------------------------
   Clinical Calculations
--------------------------------------------------------------------------- */

/**
 * Calculate Mean Arterial Pressure
 * MAP = (SYS + 2×DIA) / 3
 * @param {number} sys - Systolic pressure
 * @param {number} dia - Diastolic pressure
 * @returns {number}
 */
function calculateMAP(sys, dia) {
    return (sys + (2 * dia)) / 3;
}

/**
 * Calculate calendar day span (ignores time-of-day)
 * @param {Date} firstDate
 * @param {Date} lastDate
 * @returns {number} Number of calendar days
 */
function getCalendarDaySpan(firstDate, lastDate) {
    // Strip time components
    const firstDay = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate());
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

    return Math.round((lastDay - firstDay) / (1000 * 60 * 60 * 24)) + 1;
}

/* ---------------------------------------------------------------------------
   Linear Regression (for trendlines)
--------------------------------------------------------------------------- */

/**
 * Calculate linear regression trendline
 * @param {Array} points - Array of {x, y} objects
 * @returns {Array} Trendline points
 */
function linearRegression(points) {
    const n = points.length;
    if (n < 2) return [];

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    points.forEach(p => {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumXX += p.x * p.x;
    });

    const denom = (n * sumXX - sumX * sumX);
    if (denom === 0) return [];

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    return points.map(p => ({
        x: p.x,
        y: slope * p.x + intercept
    }));
}

console.log('[UTILS] bp_utils.js ready');