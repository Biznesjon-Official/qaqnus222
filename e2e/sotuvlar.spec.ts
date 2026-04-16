import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('/sotuvlar sahifasi', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("Dashboard \"Sotuv\" karta -> /sotuvlar sahifasi", async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/sotuvlar"]')
    await expect(page).toHaveURL(/\/sotuvlar/)
    await expect(page.locator('h1')).toContainText('Sotuvlar hisoboti')
  })

  test("default davr = shu oy", async ({ page }) => {
    await page.goto('/sotuvlar')
    const shuOy = page.locator('button', { hasText: 'Shu oy' })
    await expect(shuOy).toBeVisible()
  })

  test("\"Bugun\" preset bosilganda URL yangilanadi", async ({ page }) => {
    await page.goto('/sotuvlar')
    await page.click('button:has-text("Bugun")')
    const iso = new Date().toISOString().slice(0, 10)
    await expect(page).toHaveURL(new RegExp(`dan=${iso}.*gacha=${iso}`))
  })

  test("Hero metric ko'rinadi", async ({ page }) => {
    await page.goto('/sotuvlar')
    await expect(page.locator('text=JAMI SOTUV')).toBeVisible()
    await expect(page.locator('text=Sotuvlar')).toBeVisible()
  })

  test("Tab'lar — Kassirlar, Mijozlar, To'lov, Tovarlar, Soatlar", async ({ page }) => {
    await page.goto('/sotuvlar')
    for (const name of ['Kassirlar', 'Mijozlar', "To'lov", 'Tovarlar', 'Soatlar']) {
      await expect(page.locator('[role="tab"]', { hasText: name })).toBeVisible()
    }
  })

  test("Jadvaldagi qatorga bosish slide-out ni ochadi", async ({ page }) => {
    await page.goto('/sotuvlar')
    const firstRow = page.locator('table tbody tr').first()
    if ((await firstRow.count()) === 0) test.skip()
    await firstRow.click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })
})
