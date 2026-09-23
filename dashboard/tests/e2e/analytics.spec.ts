import { test, expect } from '@playwright/test';

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the stats API call
    await page.route('**/detections/stats/summary', async route => {
      const json = {
        total_detections: 100,
        by_severity: { severe: 20, moderate: 30, minor: 50 },
        by_status: { reported: 10, in_progress: 20, fixed: 70 },
        daily_trend: [{ date: "2026-09-01", count: 5 }],
        avg_confidence: 0.95
      };
      await route.fulfill({ json });
    });

    await page.goto('/analytics');
  });

  test('should display analytics header and summary cards', async ({ page }) => {
    await expect(page.locator('.analytics-header h1')).toHaveText('Analytics Dashboard');

    // The cards might be loading, but the container should eventually show up
    // Wait for stat labels
    await expect(page.locator('.analytics-stat-label').filter({ hasText: 'Total Detections' })).toBeVisible();
    await expect(page.locator('.analytics-stat-label').filter({ hasText: 'Severe' })).toBeVisible();
    await expect(page.locator('.analytics-stat-label').filter({ hasText: 'Moderate' })).toBeVisible();
    await expect(page.locator('.analytics-stat-label').filter({ hasText: 'Minor' })).toBeVisible();
  });

  test('should display charts', async ({ page }) => {
    // Check for chart titles
    await expect(page.getByText('Severity Distribution')).toBeVisible();
    await expect(page.getByText('Status Breakdown')).toBeVisible();
    await expect(page.getByText('Detection Trend (Last 30 Days)')).toBeVisible();
    
    // Check for Model Performance
    await expect(page.getByText('Model Performance')).toBeVisible();
    await expect(page.getByText('Average Detection Confidence')).toBeVisible();
  });
});

