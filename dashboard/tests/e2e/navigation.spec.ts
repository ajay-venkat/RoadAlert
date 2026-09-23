import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the stats API call so analytics page doesn't hang
    await page.route('**/detections/stats/summary', async route => {
      const json = {
        total_detections: 100,
        by_severity: { severe: 20, moderate: 30, minor: 50 },
        by_status: { reported: 10, in_progress: 20, fixed: 70 },
        daily_trend: [],
        avg_confidence: 0.95
      };
      await route.fulfill({ json });
    });
    
    await page.route('**/detections?*', async route => {
      const json = { total: 0, skip: 0, limit: 100, detections: [] };
      await route.fulfill({ json });
    });
  });

  test('should navigate between main pages', async ({ page }) => {
    // Start at the home page (Dashboard)
    await page.goto('/');

    // The navbar brand should be visible
    await expect(page.locator('.navbar-title')).toHaveText('RoadWatch AI');

    // Click on Analytics link
    await page.getByRole('link', { name: /Analytics/i }).click();

    // Verify URL and title on Analytics page
    await expect(page).toHaveURL(/\/analytics/);
    await expect(page.locator('.analytics-header h1')).toHaveText('Analytics Dashboard');

    // Click back to Dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();
    await expect(page).toHaveURL(/.*localhost:3000\/?$/);
    
    // Check if API link is present with correct href
    const apiLink = page.getByRole('link', { name: /API/i });
    await expect(apiLink).toBeVisible();
    await expect(apiLink).toHaveAttribute('href', 'http://localhost:8000/docs');
  });
});

