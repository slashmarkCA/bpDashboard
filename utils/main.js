/**
 * main.js
 * ============================================================
 * Application Orchestrator
 * Strictly manages the sequence: Load -> Normalize -> Initialize
 * ============================================================
 */

import { loadBPData } from './bp_data_loader.js';
import { normalizeData } from './bp_data_normalized.js';
import { initializeFilters } from './bp_filters.js';
import { showGlobalErrorBanner } from './errorHandling.js';
import { updateLastReadingDate } from '../src/lastReadingDate.js';

async function startDashboard() {
    console.log('[MAIN] Starting dashboard orchestration...');

    try {
        // 1. Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }
        console.log('[MAIN] Step 1: DOM Ready');

        // 2. Fetch data from GitHub
        const rawData = await loadBPData();
        console.log('[MAIN] Step 2: Raw data loaded');

        // 3. Normalize data
        const cleanData = normalizeData(rawData);
        updateLastReadingDate(); // ← reads window.NORMALIZED_BP_DATA set by normalizeData()
        console.log('[MAIN] Step 3: Normalization complete');

        // 4. Wire up UI and perform initial render
        initializeFilters(cleanData);
        console.log('[MAIN] Step 4: UI Initialized and Charts rendered');

    } catch (err) {
        // This catch block handles any failure in the entire chain
        console.error('[MAIN] Critical startup sequence failure:', err);
        showGlobalErrorBanner(`Dashboard failed to start: ${err.message}`);
    }
}

// Execute the startup sequence
startDashboard();