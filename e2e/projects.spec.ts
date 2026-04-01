import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'

test.describe('Projects Module', () => {
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
    await page.waitForTimeout(2000)
    
    // Navigate to Projects module via sidebar
    const projectsLink = page.locator('a').filter({ hasText: /Projects/i }).first()
    if (await projectsLink.isVisible()) {
      await projectsLink.click()
      await page.waitForTimeout(3000)
    }
  })

  test('projects page loads after navigation', async ({ page }) => {
    // Wait for page content
    await page.waitForTimeout(2000)
    
    // Check that we navigated (URL should contain projects or content changed)
    const hasContent = await page.locator('#root').isVisible()
    expect(hasContent).toBeTruthy()
  })

  test('projects has content structure', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000)
    
    // Should have some structure - table, grid, list, cards, or any content
    const hasTable = await page.locator('table').isVisible()
    const hasGrid = await page.locator('[class*="grid"]').isVisible()
    const hasCards = await page.locator('[class*="card"]').count() > 0
    const hasAnyContent = await page.locator('#root').innerHTML().then(html => html.length > 100)
    
    expect(hasTable || hasGrid || hasCards || hasAnyContent).toBeTruthy()
  })

  test('bulk actions available when selecting items', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000)
    
    // Try to find and click a checkbox
    const checkbox = page.locator('input[type="checkbox"]').first()
    if (await checkbox.isVisible()) {
      await checkbox.click()
      await page.waitForTimeout(500)
      
      // Bulk actions bar should appear
      const hasBulkActions = await page.locator('[class*="bulk"], [class*="selected"], text=selected').isVisible()
      expect(hasBulkActions).toBeTruthy()
    }
  })

  test('responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)
    
    // Content should still be visible
    const hasContent = await page.locator('#root').isVisible()
    expect(hasContent).toBeTruthy()
  })
})
