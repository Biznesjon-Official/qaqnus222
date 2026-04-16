import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('Excel eksport download qiladi', async ({ page }) => {
  await login(page)
  await page.goto('/sotuvlar')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Excel")'),
  ])

  const fileName = download.suggestedFilename()
  expect(fileName).toMatch(/\.xlsx$/)
})
