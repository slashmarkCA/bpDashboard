// ============================================================================
// bp_data_loader.js
// ============================================================================
// WHAT THIS DOES:
// Replaces the static bp_data.js file with a dynamic fetch from GitHub.
// Fetches the JSON file, validates it, and sets window.BP_DATA just like before.
// ============================================================================

/**
 * Configuration - Update this to match your GitHub setup
 */
const DATA_SOURCE = {
    // IMPORTANT: Use the "raw" GitHub URL, not the regular URL
    // Format: https://raw.githubusercontent.com/USERNAME/REPO/BRANCH/PATH
    url: 'https://raw.githubusercontent.com/slashmarkCA/bpDashboard/refs/heads/main/data/bp_readings.json',
    
    // Timeout in milliseconds (10 seconds)
    timeout: 10000
};

/**
 * Load BP data from GitHub
 * This runs immediately when the script loads
 */
(async function loadBPData() {
    console.log('[DATA LOADER] Starting data fetch from GitHub...');
    
    try {
        // Show loading indicator
        showLoadingState();
        
        // Fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DATA_SOURCE.timeout);
        
        const response = await fetch(DATA_SOURCE.url, {
            signal: controller.signal,
            cache: 'no-cache' // Always get fresh data
        });
        
        clearTimeout(timeoutId);
        
        // Check if request succeeded
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Parse JSON
        const data = await response.json();
        
        // Validate data
        if (!Array.isArray(data)) {
            throw new Error('Data is not an array');
        }
        
        if (data.length === 0) {
            throw new Error('Data array is empty');
        }
        
        // Set global variable (same as old bp_data.js did)
        window.BP_DATA = data;
        window.ALL_BP_DATA = data; // Alias for compatibility
        
        console.log(`[DATA LOADER] ✅ Successfully loaded ${data.length} readings`);
        
        // Hide loading indicator
        hideLoadingState();
        
        // Trigger the normalization and chart rendering
        // The bp_data_normalized.js script will run automatically after this
        dispatchDataLoadedEvent();
        
    } catch (error) {
        console.error('[DATA LOADER] ❌ Failed to load data:', error);
        showErrorState(error);
    }
})();

/**
 * Show loading indicator
 */
function showLoadingState() {
    // Remove any existing error message
    const existingError = document.getElementById('data-load-error');
    if (existingError) existingError.remove();
    
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'data-loading';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: 'Archivo', sans-serif;
    `;
    
    overlay.innerHTML = `
        <div style="text-align: center;">
            <div class="spinner"></div>
            <h2 style="margin-top: 20px; color: #333;">Loading Blood Pressure Data...</h2>
            <p style="color: #666;">Fetching latest readings from GitHub</p>
        </div>
        <style>
            .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #2D434E;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(overlay);
}

/**
 * Hide loading indicator
 */
function hideLoadingState() {
    const overlay = document.getElementById('data-loading');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Show error message
 */
function showErrorState(error) {
    hideLoadingState();
    
    const errorDiv = document.createElement('div');
    errorDiv.id = 'data-load-error';
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 2px solid #dc3545;
        border-radius: 8px;
        padding: 30px;
        max-width: 500px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        font-family: 'Archivo', sans-serif;
    `;
    
    errorDiv.innerHTML = `
        <h2 style="color: #dc3545; margin-top: 0;">⚠️ Failed to Load Data</h2>
        <p style="color: #333; margin: 15px 0;">
            <strong>Error:</strong> ${error.message}
        </p>
        <p style="color: #666; font-size: 14px; margin: 15px 0;">
            <strong>Possible causes:</strong>
        </p>
        <ul style="color: #666; font-size: 14px; margin: 10px 0; padding-left: 20px;">
            <li>GitHub repository is private (data file must be public)</li>
            <li>File path is incorrect in configuration</li>
            <li>Network connection issue</li>
            <li>Data file hasn't been synced yet (run Google Sheets sync)</li>
        </ul>
        <button onclick="location.reload()" style="
            background: #2D434E;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 15px;
        ">
            Retry
        </button>
        <p style="color: #999; font-size: 12px; margin-top: 15px;">
            Check browser console (F12) for technical details
        </p>
    `;
    
    document.body.appendChild(errorDiv);
}

/**
 * Dispatch event to signal data is loaded
 * This allows other scripts to wait for data before initializing
 */
function dispatchDataLoadedEvent() {
    const event = new CustomEvent('bpDataLoaded', {
        detail: { recordCount: window.BP_DATA.length }
    });
    window.dispatchEvent(event);
}

/**
 * Export for modules that need to check if data is loaded
 */
window.isBPDataLoaded = () => {
    return window.BP_DATA && Array.isArray(window.BP_DATA) && window.BP_DATA.length > 0;
};