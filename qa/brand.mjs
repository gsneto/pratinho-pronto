import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const output = resolve('output/ui-qa', process.argv[2] ?? `brand-${Date.now()}`)
mkdirSync(output, { recursive: true })
const browser = await chromium.launch()
const results = []
const profiles = [[1440, 'light'], [1440, 'dark'], [768, 'light'], [768, 'dark'], [390, 'light'], [320, 'dark']]
try {
  for (const [width, theme] of profiles) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme })
    const page = await context.newPage()
    await page.addInitScript((chosen) => localStorage.setItem('pratinho-pronto-theme', chosen), theme)
    const record = { width, theme, status: 'pending' }
    try {
      await page.goto('http://127.0.0.1:4178/login')
      await page.locator('#email').waitFor()
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((image) => image.decode().catch(() => {}))) })
      const logo = page.locator('[role="img"][aria-label="Pratinho Pronto"]:visible').first()
      record.screenshot = resolve(output, `brand-${width}-${theme}.png`)
      await logo.screenshot({ path: record.screenshot })
      record.geometry = await logo.evaluate((element) => {
        const image = [...element.querySelectorAll('img')].find((candidate) => candidate.getBoundingClientRect().width > 0)
        const imageRect = image.getBoundingClientRect()
        const frameRect = image.parentElement.getBoundingClientRect()
        return { image: imageRect.toJSON(), frame: frameRect.toJSON() }
      })
      const { image, frame } = record.geometry
      assert.ok(image.top >= frame.top - 1 && image.bottom <= frame.bottom + 1 && image.left >= frame.left - 1 && image.right <= frame.right + 1, 'Logo image box escapes its visible frame')
      const audit = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
      record.violations = audit.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))
      record.incomplete = audit.incomplete.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))
      assert.deepEqual(record.violations, [])
      assert.deepEqual(record.incomplete, [], 'Login contrast must be automatically measurable')
      record.status = 'passed'
    } catch (error) { record.status = 'failed'; record.error = error.message }
    finally {
      results.push(record)
      appendFileSync(resolve(output, 'cases.jsonl'), JSON.stringify(record) + '\n')
      console.log(JSON.stringify(record))
      await context.close()
    }
  }
} finally { await browser.close() }
const summary = { expected: profiles.length, completed: results.length, passed: results.filter((record) => record.status === 'passed').length, results }
writeFileSync(resolve(output, 'brand.json'), JSON.stringify(summary, null, 2))
assert.equal(summary.passed, summary.expected)
