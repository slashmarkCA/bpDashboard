/* ============================================================================
   bp_utils.js
   ---------------------------------------------------------------------------
   Shared utilities for Blood Pressure Dashboard
   - Date formatting (axis & tooltips)
   - Chart lifecycle management
   - Common calculations
   ============================================================================ */

/* ---------------------------------------------------------------------------
   Date Formatting
--------------------------------------------------------------------------- */

/**
 * Format date for chart x-axis (DD-MMM format)
 * @param {Date} dateObj
 * @returns {string} e.g., "17-Jan"
 */
export function formatAxisDate(dateObj) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${day}-${months[dateObj.getMonth()]}`;
}

/**
 * Format date for tooltips (full datetime with AM/PM)
 * @param {Date} dateObj
 * @returns {string} e.g., "January 17, 2026 9:33:17 pm"
 */
export function formatTooltipDate(dateObj) {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
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
export function getLocalDateKey(dateObj) {
    if (!(dateObj instanceof Date)) return null;
    return dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
}

/* ---------------------------------------------------------------------------
   Chart Lifecycle Management
--------------------------------------------------------------------------- */

/**
 * Safely destroy a Chart.js instance
 * @param {Chart|null} chartInstance
 * @returns {null}
 */
export function destroyChart(chartInstance) {
    if (chartInstance && typeof chartInstance.destroy === 'function') {
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
export function calculateMAP(sys, dia) {
    return (sys + (2 * dia)) / 3;
    // TODO: Study this: https://gemini.google.com/app/71c6be281e028883
    // The "2x" Multiplier: By multiplying the Diastolic (bottom) number by 2, the code ensures it accounts for two-thirds of the total result.
    // The Division by 3: Since you are essentially adding one part Systolic and two parts Diastolic, you divide by 3 to get the weighted average.
}

/**
 * Calculate calendar day span (ignores time-of-day)
 * @param {Date} firstDate
 * @param {Date} lastDate
 * @returns {number} Number of calendar days
 */
export function getCalendarDaySpan(firstDate, lastDate) {
    // Strip time components
    const firstDay = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate());
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

    return Math.round((lastDay - firstDay) / (1000 * 60 * 60 * 24)) + 1;
}



/* ---------------------------------------------------------------------------
   Single Source of Truth for 
--------------------------------------------------------------------------- */

// Data dictionaries to keep colors and labels consistent
export const BP_LEVELS = {
    CRISIS:   { score: 5, label: "Hypertensive Crisis", color: "#ad322d" },
    STAGE2:   { score: 4, label: "Hypertension Stage 2", color: "#d95139", lightColor: "#ebb6ad" },
    STAGE1:   { score: 3, label: "Hypertension Stage 1", color: "#eeb649", lightColor: "#efcec9" },
    ELEVATED: { score: 2, label: "Elevated",             color: "#204929", lightColor: "#7fb13d" },
    NORMAL:   { score: 1, label: "Normal",               color: "#30693c", lightColor: "#d1e3d5" },
    UNKNOWN:  { score: 0, label: "No Known Rule",        color: "#ebedf0", lightColor: "#f8f9fa" }
};

// Constant for structural UI elements that aren't specific BP levels
export const UI_COLORS = {
    NOT_NORMAL: "#c44a37",
    WORKDAY: "#2c2c2c",
    NON_WORKDAY: "#ffffff"
};

export const PULSE_LEVELS = {
    TACHY:  { label: "Tachycardia",   color: "#424242"  },
    NORMAL: { label: "Normal Pulse",  color: "#216e39" },
    BRADY:  { label: "Bradycardia",   color: "#424242" },
    UNKNOWN:{ label: "No Known Rule", color: "#ebedf0" }
};

// --- CALCULATORS ---

export function getBPCategory(sys, dia) {
    if (!sys || !dia) return BP_LEVELS.UNKNOWN;
    const s = Number(sys);
    const d = Number(dia);

    if (s > 180 || d > 120) return BP_LEVELS.CRISIS;
    if (s >= 140 || d >= 90) return BP_LEVELS.STAGE2;
    if ((s >= 130 && s <= 139) || (d >= 80 && d <= 89)) return BP_LEVELS.STAGE1;
    if (s >= 120 && s <= 129 && d < 80) return BP_LEVELS.ELEVATED;
    if (s < 120 && d < 80) return BP_LEVELS.NORMAL;
    return BP_LEVELS.UNKNOWN;
}

export function getPulseCategory(bpm) {
    const b = Number(bpm);
    if (!b) return PULSE_LEVELS.UNKNOWN;
    if (b > 100) return PULSE_LEVELS.TACHY;
    if (b >= 60) return PULSE_LEVELS.NORMAL;
    if (b < 60)  return PULSE_LEVELS.BRADY;
    return PULSE_LEVELS.UNKNOWN;
}

export function getPulsePressureCategory(pp) {
    const v = Number(pp);
    if (isNaN(v)) return { label: "No Known Rule", color: "#ebedf0" };
    if (v >= 66) return { label: "Very Widened", color: "#c70000" };
    if (v >= 61) return { label: "Widened",      color: "#ffcc00" };
    if (v >= 41) return { label: "Normal",       color: "#216e39" };
    if (v >= 0)  return { label: "Narrowed",     color: "#9be9a8" };
    return { label: "No Known Rule", color: "#ebedf0" };
}

/* ---------------------------------------------------------------------------
   Linear Regression (for trendlines)
--------------------------------------------------------------------------- */

/**
 * Calculate linear regression trendline
 * @param {Array} points - Array of {x, y} objects
 * @returns {Array} Trendline points
 */
export function linearRegression(points) {
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


// Normalize a date range to full calendar days (Midnight to 11:59:59 PM)
// This ensures all charts and summary cards use the exact same record set.  I had problems with Avg() because of milliseconds.
export function getCalendarRange(endDate, daysBack) {
    // End of today (23:59:59)
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
    // Midnight N days ago
    const start = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - (daysBack - 1), 0, 0, 0);
    return { start, end };
}

// Added helper for consistent transparency across histograms
export function getAlphaColor(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ---------------------------------------------------------------------------
   Font selector from .css :root for vanilla .js and chart.js <canvas> renders.
--------------------------------------------------------------------------- */

// bp_utils.js

export function getCssStyles(theme = "light", familyType = "chart") {
    const root = getComputedStyle(document.documentElement);

    // Build axis‑label variable names dynamically
    const colorVar  = `--font-${theme}-axisLabel-color`;
    const sizeVar   = `--font-${theme}-axisLabel-size`;
    const weightVar = `--font-${theme}-axisLabel-weight`;
    const axisTitleWeightVar = `--font-${theme}-axisTitle-weight`
    const axisTitleSizeVar = `--font-${theme}-axisTitle-size`

    // Choose which family variable to read
    const familyVar = familyType === "chart" ? "--font-chart" : "--font-base";

    const family = root.getPropertyValue(familyVar).trim();
    const color  = root.getPropertyValue(colorVar).trim();
    const size   = parseFloat(root.getPropertyValue(sizeVar));
    const weight = root.getPropertyValue(weightVar).trim();
    const axisTitleWeight = root.getPropertyValue(axisTitleWeightVar).trim();
    const axisTitleSize = root.getPropertyValue(axisTitleSizeVar).trim();
    return { family, color, size, weight, axisTitleSize, axisTitleWeight };
}

/* ---------------------------------------------------------------------------
   Global Event Listener
--------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    // Event delegation for info icons
    document.addEventListener('click', (e) => {
        const infoIcon = e.target.closest('.info-icon');
        if (infoIcon && infoIcon.dataset.drawer) {
            openDocDrawer(infoIcon.dataset.drawer);
        }
    });
});