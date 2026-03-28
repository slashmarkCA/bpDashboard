// ============================================================================
// bp_data_loader.js
// Fetches the JSON file, validates it, and returns it for the orchestrator.
// ============================================================================

import { showGlobalErrorBanner } from './errorHandling.js';

/**
 * Configuration - Update this to match your GitHub setup
 */
const DATA_SOURCE = {
    // IMPORTANT: Use the "raw" GitHub URL, not the regular URL
    url: 'https://raw.githubusercontent.com/slashmarkCA/bpDashboard/refs/heads/main/data/bp_readings.json',
    
    // Timeout in milliseconds (10 seconds)
    timeout: 10000
};

/**
 * Load BP data from GitHub
 * Exported to be called by the central orchestrator (main.js)
 * @returns {Promise<Array>} The raw array of blood pressure readings
 */
export async function loadBPData() {
    console.log('[DATA LOADER] Starting data fetch from GitHub...');
    
    try {
        // Fetch with timeout logic
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
        
        // Validate data structure
        if (!Array.isArray(data)) {
            throw new Error('Data format error: Expected an array of readings.');
        }
        
        if (data.length === 0) {
            throw new Error('No readings found: The data file appears to be empty.');
        }
        
        console.log(`[DATA LOADER] Successfully loaded ${data.length} readings`);
        
        // Return data for the next step in the sequence (Normalization)
        return data;
        
    } catch (error) {
        console.error('[DATA LOADER] Failed to load data:', error);
        
        // Use the centralized DRY pattern for UI feedback
        showGlobalErrorBanner(`Failed to load data: ${error.message}`);
        
        throw error; // Re-throw so the orchestrator knows to halt the sequence
    }
}