import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
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
      const json = {
        total: 0,
        skip: 0,
        limit: 100,
        detections: []
      };
      await route.fulfill({ json });
    });

    await page.goto('/');
  });

  test('should display the main layout components', async ({ page }) => {
    // Wait for the app container
    await expect(page.locator('.app-container')).toBeVisible();

    // Check for the sidebar
    await expect(page.locator('.sidebar')).toBeVisible();

    await expect(page.locator('.main-content')).toBeVisible();
  });

  test('should display stats panel', async ({ page }) => {
    // We expect the section title "Detections"
    await expect(page.getByText('Detections', { exact: true })).toBeVisible();
    
    // Check for the filter panel
    await expect(page.locator('.sidebar-section-title').filter({ hasText: 'Filters' })).toBeVisible();
  });
});

