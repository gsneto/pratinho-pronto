import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const browser = await chromium.launch()
const failures = []
try {
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' })
    const page = await context.newPage()
    await page.request.post('http://127.0.0.1:4178/__qa/reset')
    await page.goto('http://127.0.0.1:4178/app/week')
    await page.locator('#week-history-title').waitFor()
    try { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width) }
    catch { failures.push(`Week overflows at ${width}px`) }
    try { await page.getByRole('button', { name: 'Sair da conta' }).waitFor({ timeout: 1000 }) }
    catch { failures.push(`Logout unreachable at ${width}px`) }
    await page.goto('http://127.0.0.1:4178/app/profile')
    await page.locator('#baby-name').waitFor()
    const result = await new AxeBuilder({ page }).withRules(['label', 'color-contrast']).analyze()
    for (const violation of result.violations) failures.push(`${width}px profile: ${violation.id}`)
    await page.close()
  }
} finally { await browser.close() }
console.log(JSON.stringify({ failures }, null, 2))
assert.deepEqual(failures, [])
