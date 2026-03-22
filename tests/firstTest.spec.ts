import { test, expect } from '@playwright/test';

// https://gemini.google.com/app/19ffcf12df643930
// This is the rabbit hole behind this script.
// Study it.  I hit a window.BP_DATA problem I wasn't expecting, and other things like testing console.log() events which I will do heavily.

test.describe('Blood Pressure Dashboard Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Replace with your local dev URL or GitHub Pages URL
    await page.goto('http://localhost:5500'); 
  });

  test('should load the page and show the correct title', async ({ page }) => {
    // Verifies the <title> tag
    await expect(page).toHaveTitle(/Blood Pressure Dashboard/);
  });

  test('should render the main chart container', async ({ page }) => {
    // Ensure your Chart.js <canvas> or container exists
    const chart = page.locator('#bpChart'); // Adjust ID to match your HTML
    await expect(chart).toBeVisible();
  });

  test('should show import results summary', async ({ page }) => {
    // This tests your "Reconciliation" logic (Backlog #37)
    // Checks if the UI <div> you created is actually visible
    const summary = page.locator('.import-summary'); 
    await expect(summary).toBeVisible();
    await expect(summary).not.toBeEmpty();
  });
});

// EVENT DRIVEN LOGIC:
// Because the scripts wait for bpDataLoaded, use Playwright to verify that the event actually fires. 
// You can "spy" on the console or check if a specific global variable is set:
test('should have BP_DATA on the window object', async ({ page }) => {
  const dataExists = await page.evaluate(() => {
    return window.hasOwnProperty('BP_DATA') && window.BP_DATA.length > 0;
  });
  expect(dataExists).toBe(true);
});