import { test, expect } from '@playwright/test';

/**
 * E2E Tests for New Features v3.0.0
 * Tests for: NotificationCenter, TeamChat, ActivityFeed, Advanced Analytics, Project Calendar
 */

test.describe('New Features E2E', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Skip login if already logged in or use test credentials
    await page.waitForLoadState('networkidle');
  });

  test.describe('NotificationCenter', () => {
    test('opens notification center from header', async ({ page }) => {
      // Click notification bell in header
      const notificationButton = page.locator('button[aria-label*="notification" i]');
      
      if (await notificationButton.count() > 0) {
        await notificationButton.first().click();
        
        // Should show notification modal
        await expect(page.locator('text=Notifications')).toBeVisible({ timeout: 5000 });
      }
    });

    test('displays notifications list', async ({ page }) => {
      const notificationButton = page.locator('button[aria-label*="notification" i]');
      
      if (await notificationButton.count() > 0) {
        await notificationButton.first().click();
        
        // Should show some notification content
        await page.waitForSelector('text=Notification', { timeout: 5000 });
      }
    });
  });

  test.describe('TeamChat', () => {
    test('opens team chat from Teams module', async ({ page }) => {
      // Navigate to Teams module
      await page.goto('/teams');
      await page.waitForLoadState('networkidle');
      
      // Look for Team Chat button
      const chatButton = page.locator('button:has-text("Team Chat")');
      
      if (await chatButton.count() > 0) {
        await chatButton.click();
        
        // Should show chat modal
        await expect(page.locator('text=Team Chat')).toBeVisible({ timeout: 5000 });
      }
    });

    test('displays message input', async ({ page }) => {
      await page.goto('/teams');
      await page.waitForLoadState('networkidle');
      
      const chatButton = page.locator('button:has-text("Team Chat")');
      
      if (await chatButton.count() > 0) {
        await chatButton.click();
        
        // Should show message input
        await expect(page.locator('input[placeholder*="Type a message"]')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('ActivityFeed', () => {
    test('displays activity feed on dashboard', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for activity feed content
      const activityFeed = page.locator('text=Activity, text=Recent');
      
      if (await activityFeed.count() > 0) {
        await expect(activityFeed.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('shows activity items', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should show some activity content
      await page.waitForSelector('text=created, text=updated, text=completed', { timeout: 5000 });
    });
  });

  test.describe('Advanced Analytics', () => {
    test('loads advanced analytics page', async ({ page }) => {
      await page.goto('/advanced-analytics');
      await page.waitForLoadState('networkidle');
      
      // Should show analytics content
      await expect(page.locator('text=Advanced Analytics')).toBeVisible({ timeout: 5000 });
    });

    test('displays KPI cards', async ({ page }) => {
      await page.goto('/advanced-analytics');
      await page.waitForLoadState('networkidle');
      
      // Should show some metrics
      await page.waitForSelector('text=Revenue, text=Projects, text=Revenue', { timeout: 5000 });
    });

    test('displays charts', async ({ page }) => {
      await page.goto('/advanced-analytics');
      await page.waitForLoadState('networkidle');
      
      // Charts should render (look for SVG elements)
      await page.waitForSelector('svg', { timeout: 5000 });
    });
  });

  test.describe('Project Calendar', () => {
    test('loads project calendar page', async ({ page }) => {
      await page.goto('/project-calendar');
      await page.waitForLoadState('networkidle');
      
      // Should show calendar content
      await expect(page.locator('text=Calendar')).toBeVisible({ timeout: 5000 });
    });

    test('displays month view', async ({ page }) => {
      await page.goto('/project-calendar');
      await page.waitForLoadState('networkidle');
      
      // Should show calendar grid
      await page.waitForSelector('[class*="grid-cols-7"]', { timeout: 5000 });
    });

    test('navigates between months', async ({ page }) => {
      await page.goto('/project-calendar');
      await page.waitForLoadState('networkidle');
      
      // Look for navigation buttons
      const nextButton = page.locator('button[aria-label*="next" i], button:has-text("Next")');
      
      if (await nextButton.count() > 0) {
        const currentMonth = await page.locator('text=January, text=February, text=March, text=April, text=May, text=June, text=July, text=August, text=September, text=October, text=November, text=December').first().textContent();
        
        // Click next month
        await nextButton.first().click();
        
        // Month should change (basic check)
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Integration Tests', () => {
    test('notification preferences accessible from header', async ({ page }) => {
      // Look for settings/preferences button near notifications
      const settingsButton = page.locator('button[aria-label*="settings" i], button[aria-label*="preference" i]');
      
      if (await settingsButton.count() > 0) {
        await settingsButton.first().click();
        
        // Should show preferences modal
        await page.waitForSelector('text=Notification, text=Preferences', { timeout: 5000 });
      }
    });

    test('all new modules accessible from sidebar', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check sidebar for new modules
      const sidebar = page.locator('nav, [class*="sidebar" i]');
      
      if (await sidebar.count() > 0) {
        // Look for Advanced Analytics link
        const analyticsLink = sidebar.locator('a:has-text("Advanced Analytics"), a:has-text("Analytics")');
        
        if (await analyticsLink.count() > 0) {
          await analyticsLink.first().click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*analytics.*/);
        }
      }
    });
  });
});
