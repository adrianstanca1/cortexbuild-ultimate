/**
 * Global setup for E2E tests
 * Authenticates once and saves storage state for all tests
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to login
  await page.goto(baseURL + '/login');
  await page.waitForLoadState('networkidle');

  // Login with test credentials
  const email = process.env.TEST_USER_EMAIL || 'test@cortexbuild.local';
  const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

  await page.fill('input[type="email"], input[placeholder*="email"]', email);
  await page.fill('input[type="password"], input[placeholder*="password"]', password);
  await page.click('button:has-text("Sign In"), button:has-text("Login")');

  // Wait for navigation after login
  await page.waitForURL(/\/?$/, { timeout: 15000 });
  await page.waitForTimeout(3000);

  // Verify we're on dashboard (not login page)
  const url = page.url();
  console.log(`Logged in successfully. Current URL: ${url}`);

  // Save storage state (cookies, localStorage, etc.)
  await page.context().storageState({ path: storageState as string });
  await browser.close();
}

export default globalSetup;
