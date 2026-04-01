import { test, expect } from '@playwright/test'

test.describe('Projects Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for app to load and navigate to projects
    await page.waitForSelector('#root', { timeout: 10000 })
    
    // Navigate to Projects module
    const projectsLink = page.locator('[data-sidebar] a').filter({ hasText: /projects/i }).first()
    if (await projectsLink.isVisible()) {
      await projectsLink.click()
      await page.waitForTimeout(1000)
    }
  })

  test('projects page loads', async ({ page }) => {
    // Check for projects header or content
    await expect(page.locator('h1, h2').filter({ hasText: /project/i }).first()).toBeVisible()
  })

  test('create project button is visible', async ({ page }) => {
    // Look for create/add button
    const createBtn = page.locator('button').filter({ hasText: /new|create|add/i }).first()
    await expect(createBtn).toBeVisible()
  })

  test('projects table or grid displays', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000)
    
    // Should have either a table, grid, or empty state
    const hasTable = await page.locator('table').isVisible()
    const hasGrid = await page.locator('[class*="grid"]').isVisible()
    const hasEmptyState = await page.locator('[data-empty-state]').isVisible()
    
    expect(hasTable || hasGrid || hasEmptyState).toBeTruthy()
  })

  test('project filters are available', async ({ page }) => {
    // Wait for filters to load
    await page.waitForTimeout(1000)
    
    // Look for filter inputs or dropdowns
    const hasFilters = await page.locator('input[placeholder*="filter"], input[placeholder*="search"], select').isVisible()
    expect(hasFilters).toBeTruthy()
  })

  test('bulk actions bar appears when selecting items', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000)
    
    // Try to find and click a checkbox
    const checkbox = page.locator('input[type="checkbox"]').first()
    if (await checkbox.isVisible()) {
      await checkbox.click()
      await page.waitForTimeout(500)
      
      // Bulk actions bar should appear
      const bulkActions = page.locator('[data-bulk-actions]')
      await expect(bulkActions).toBeVisible()
    }
  })

  test('edit modal opens for project', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000)
    
    // Look for edit button or action
    const editBtn = page.locator('button').filter({ hasText: /edit/i }).first()
    if (await editBtn.isVisible()) {
      await editBtn.click()
      await page.waitForTimeout(500)
      
      // Modal should open
      const modal = page.locator('[role="dialog"], [data-modal]')
      await expect(modal).toBeVisible()
      
      // Close modal with Escape
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    }
  })

  test('responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    
    // Mobile layout should be active
    const mobileNav = page.locator('[data-mobile-nav]')
    await expect(mobileNav).toBeVisible()
  })
})
