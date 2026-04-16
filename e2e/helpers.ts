import type { Page } from '@playwright/test'

export async function login(page: Page, loginVal = 'admin', parolVal = 'admin123') {
  await page.goto('/login')
  // LoginForm uses controlled state (no name attributes).
  // Selectors based on autocomplete attributes present on the inputs.
  await page.fill('input[autocomplete="username"]', loginVal)
  await page.fill('input[autocomplete="current-password"]', parolVal)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(?!login)/)
}
