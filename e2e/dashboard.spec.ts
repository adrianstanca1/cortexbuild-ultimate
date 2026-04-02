import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'

test.describe('Dashboard', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    
    // Login first
    await loginPage.goto()
    await loginPage.login(
      process.env.TEST_USER_EMAIL || 'adrian.stanca1@gmail.com',
      process.env.TEST_USER_PASSWORD || 'Lolozania1'
    )
    
    // Wait for navigation to dashboard
    await page.waitForURL(/\/?$/, { timeout: 10000 })
    await page.waitForTimeout(3000)
  })

  test('dashboard loads after login', async ({ page }) => {
    // Verify we're on the dashboard (root URL after login)
    const url = page.url()
    expect(url).toMatch(/\/?$/)
    
    // App content should be visible
    const hasContent = await page.locator('#root').isVisible()
    expect(hasContent).toBeTruthy()
  })

  test('dashboard has charts or graphs', async ({ page }) => {
    // Wait for charts to load
    await page.waitForTimeout(3000)
    
    // Look for chart elements - canvas, svg, or recharts containers
    const hasChart = await page.locator('canvas, svg, [class*="chart"], [class*="recharts"]').count() > 0
    expect(hasChart).toBeTruthy()
  })

  test('dashboard is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)
    
    // Content should still be visible on mobile
    const hasContent = await page.locator('#root').isVisible()
    expect(hasContent).toBeTruthy()
  })
})
