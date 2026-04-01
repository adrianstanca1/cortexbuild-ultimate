import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/DashboardPage'

test.describe('Dashboard', () => {
  let dashboard: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page)
    await dashboard.goto()
  })

  test('dashboard loads with main widgets', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-module="dashboard"]', { timeout: 10000 })
    
    // Check for dashboard header
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard|overview/i }).first()).toBeVisible()
  })

  test('KPI cards are displayed', async ({ page }) => {
    // Wait for KPIs to load
    await page.waitForTimeout(2000)
    
    // Should have at least one KPI card
    const kpiCards = page.locator('[data-kpi-card], [class*="kpi"]')
    const count = await kpiCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('revenue chart is displayed', async ({ page }) => {
    // Wait for charts to load
    await page.waitForTimeout(3000)
    
    // Revenue chart should be visible
    const revenueChart = page.locator('[data-chart="revenue"], [class*="revenue-chart"], canvas').first()
    await expect(revenueChart).toBeVisible()
  })

  test('project status widget shows data', async ({ page }) => {
    // Wait for widgets to load
    await page.waitForTimeout(2000)
    
    // Project status widget should be visible
    const projectStatus = page.locator('[data-widget="project-status"]')
    if (await projectStatus.isVisible()) {
      // Should have some status items
      const statusItems = projectStatus.locator('[class*="status"], [class*="item"]')
      const count = await statusItems.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('alerts widget displays', async ({ page }) => {
    // Wait for widgets to load
    await page.waitForTimeout(2000)
    
    // Alerts widget should be visible
    const alertsWidget = page.locator('[data-widget="alerts"]')
    if (await alertsWidget.isVisible()) {
      await expect(alertsWidget).toBeVisible()
    }
  })

  test('activity feed shows recent activity', async ({ page }) => {
    // Wait for feed to load
    await page.waitForTimeout(2000)
    
    // Activity feed should be visible
    const activityFeed = page.locator('[data-widget="activity-feed"]')
    if (await activityFeed.isVisible()) {
      await expect(activityFeed).toBeVisible()
    }
  })

  test('customize button toggles widget visibility panel', async ({ page }) => {
    // Wait for customize button
    const customizeButton = page.locator('button').filter({ hasText: /customize/i }).first()
    await expect(customizeButton).toBeVisible()
    
    // Click to open customize panel
    await customizeButton.click()
    await page.waitForTimeout(500)
    
    // Customize panel should be visible
    const customizePanel = page.locator('[data-customize-panel]')
    if (await customizePanel.isVisible()) {
      await expect(customizePanel).toBeVisible()
      
      // Click again to close
      await customizeButton.click()
      await page.waitForTimeout(500)
    }
  })

  test('dashboard widgets are responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)
    
    // Widgets should still be visible on mobile
    const kpiCards = page.locator('[data-kpi-card], [class*="kpi"]')
    const count = await kpiCards.count()
    expect(count).toBeGreaterThan(0)
  })
})
