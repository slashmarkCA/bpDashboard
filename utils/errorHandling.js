/**
 * utils/errorHandling.js
 * ============================================================
 * Global Error and Exception Handling
 * - Catches runtime execution errors
 * - Catches unhandled promise rejections
 * - Provides UI feedback for library and network failures
 * - Now with ES6 module exports
 * ============================================================
 */

// 1. Listen for standard JS errors (syntax, reference, etc.)
window.addEventListener("error", (event) => {
    // Some browser extensions or cross-origin scripts might trigger generic "Script error."
    // We log the details we have and show the banner.
    const errorMsg = event.message || "An unexpected JavaScript error occurred.";
    console.error("Global JS Error:", errorMsg, "at", event.filename, ":", event.lineno);
    
    showGlobalErrorBanner(errorMsg);
});

// 2. Listen for failed Promises (API calls, async data loading)
window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason || "Unknown promise rejection";
    console.error("Unhandled Promise Rejection:", reason);
    
    showGlobalErrorBanner("A background operation failed. Data may be incomplete.");
});

/**
 * Creates and displays a warning banner at the top of the page.
 * Includes a 'Guard Clause' to prevent multiple banners from stacking.
 */
function showGlobalErrorBanner(msg) {
    // Guard: Don't add another banner if one is already visible
    if (document.getElementById("globalErrorBanner")) return;

    const div = document.createElement("div");
    div.id = "globalErrorBanner";
    div.className = "global-error-banner";
    
    // Using innerHTML to allow for the flex layout and close button
    div.innerHTML = `
        <span style="display: flex; align-items: center; gap: 10px;">
            ⚠️ ${msg}
        </span>
        <button onclick="this.parentElement.remove()" 
                style="cursor:pointer; background:none; border:none; font-size:18px; font-weight:bold; color:#664d03; line-height:1;">
            ✕
        </button>
    `;

    // Prepend to body so it appears above the header (unless header is fixed)
    document.body.prepend(div);
}

/**
 * Dependency Check
 * Called by updateAllCharts() to ensure Chart.js is available.
 * Hardened to trigger both Global and Local alerts.
 */
function checkChartDependencies() {
    if (!window.Chart) {
        console.error("Chart.js failed to load");
        
        // Trigger the top banner for high visibility
        showGlobalErrorBanner("Charts could not be initialized (Chart.js library missing).");
        
        // Trigger local messages in the chart slots
        showChartError("Charts unavailable (library failed to load)");
        
        return false;
    }
    return true;
}

/**
 * Targets all containers with the class .chart-container and 
 * injects an error message.
 */
function showChartError(msg) {
    const containers = document.querySelectorAll(".chart-container");
    
    if (containers.length === 0) {
        console.warn("No .chart-container elements found to display error:", msg);
        return;
    }

    containers.forEach(el => {
        el.innerHTML = `<div class="chart-error">${msg}</div>`;
    });
}

// Window Bridge (Keep for legacy inline script calls if any)
window.showGlobalErrorBanner = showGlobalErrorBanner;

// ES6 Module Exports
export { showGlobalErrorBanner, checkChartDependencies, showChartError };