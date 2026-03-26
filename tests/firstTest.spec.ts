import { test, expect } from '@playwright/test';

// https://gemini.google.com/app/19ffcf12df643930
// This is the rabbit hole behind this script.
// Study it.  I hit a window.BP_DATA problem I wasn't expecting, and other things like testing console.log() events which I will do heavily.

// I ran the Event Driven logic to check the window for BP_DATA and got this error in the test report and vs code itself:
// Property 'BP_DATA' does not exist on type 'Window & typeof globalThis'.
// Hello rabbit hole.....I had to tell typescript IN THIS SPEC FILE and probably every one from now on (grrrr).
// By doing this, you are "merging" your custom definition into the global Window interface. The error in VS Code will disappear immediately.
// I don't need the global declaration at the moment but I left it in in case I need  to learn.

declare global {
  interface Window {
    NORMALIZED_BP_DATA: any[]; // You can change 'any[]' to a specific type later
  }
}

test.describe('Blood Pressure Dashboard Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5500'); 
  });

  test('Verify the page loads and has a non-empty <title> text', {
      annotation: {
        type: 'Application/SEO-WCAG',         
        description: 'Verify page loads with a Title tag for SEO - to be expanded as pages are added.'
      },
    }, async ({ page }) => {
    // Verifies the <title> tag
    await expect(page).toHaveTitle(/Blood/);
  });


  test('Verify all charts render successfully after data load', {
    annotation: {
      type: 'Application/DOM',
      description: 'Happy-path: Ensures the pipeline from data ingestion through normalization executes well, no silent failures occur, and the dashboard appears complete because the containers will not have an empty byte size.'
    },
  }, async ({ page }) => {
    const chartIds = [
      '#bpRawDataTableWrapper',
      '#combinedRollingChart',
      '#map7DayChart',
      '#sysAndDiaChart',
      '#boxWhiskerChart', 
      '#pulsePressureLineChart',
      '#pulsePressureHistogram', 
      '#pulseLineChart',
      '#pulseHistogram',
      '#categoryChart', 
      '#bpScatterChart'
    ];

    // REWRITE AND LEARN WITH THIS TEST.
    // https://chatgpt.com/c/69c0b6c5-719c-832d-abfe-6521110494c6
    // Check for bpDataLoaded since dashboard is event-driven
    await page.evaluate(() => {
      return new Promise(resolve => {
        if (window.NORMALIZED_BP_DATA) resolve(); // Already loaded?
        window.addEventListener('bpDataLoaded', resolve, { once: true });
      });
    });

    for (const id of chartIds) {
      await test.step(`Checking visibility for ${id}`, async () => {
        await expect(page.locator(id)).toBeVisible();
      });
    }
  });

});