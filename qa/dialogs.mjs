import assert from 'node:assert/strict'
import { chromium, firefox, webkit, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { measureRenderedContrast } from './rendered-contrast.mjs'

const origin = 'http://127.0.0.1:4178'
const browserName = process.env.QA_BROWSER ?? 'chromium'
const browserType = { chromium, firefox, webkit }[browserName]
if (!browserType) throw new Error(`Unsupported QA_BROWSER: ${browserName}`)
const label = process.argv[2] ?? `dialogs-${browserName}-${Date.now()}`
if (!/^[a-zA-Z0-9_-]+$/.test(label)) throw new Error('Use a simple, unique run label')
const output = resolve('output/ui-qa', label)
if (existsSync(output)) throw new Error(`Evidence directory already exists: ${output}`)
for (const directory of ['screenshots', 'axe-raw']) mkdirSync(resolve(output, directory), { recursive: true })
const profiles = [
  ['desktop-light', 1440, 1000, 'light'], ['desktop-dark', 1440, 1000, 'dark'],
  ['mobile-light', 390, 844, 'light'], ['mobile-dark', 390, 844, 'dark'],
  ['narrow-light', 320, 740, 'light'], ['tablet-dark', 768, 1024, 'dark'],
].filter(([name]) => !process.env.QA_PROFILE || name === process.env.QA_PROFILE)
const scenarios = [
  ['planner', '/app/recipes/qa-recipe-mingau-de-banana-e-aveia', 'Colocar na minha semana', 'Fechar planejamento'],
  ['replacement', '/app/week?week=2026-09-07', /^Trocar /, 'Fechar alternativas'],
  ['shopping-item', '/app/shopping-list?week=2026-09-14', 'Adicionar item', 'Fechar'],
].filter(([name]) => !process.env.QA_DIALOG || name === process.env.QA_DIALOG)
if (!profiles.length || !scenarios.length) throw new Error('QA filters selected no cases')
const results = []
const browser = await browserType.launch()
const version = browser.version()
try {
  for (const [profile, width, height, theme] of profiles) {
    for (const [name, path, triggerName, closeName] of scenarios) {
      const context = await browser.newContext({
        viewport: { width, height }, isMobile: width <= 600 && browserName !== 'firefox',
        hasTouch: width <= 900, colorScheme: theme, locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block', reducedMotion: 'reduce',
      })
      const record = { browser: browserName, profile, name, path, viewport: { width, height }, theme, status: 'pending', pageErrors: [], consoleErrors: [], externalRequests: [], httpErrors: [], measurements: [] }
      await context.route('**/*', async (route) => {
        if (new URL(route.request().url()).origin !== origin) {
          record.externalRequests.push(route.request().url())
          await route.abort()
        } else await route.continue()
      })
      const page = await context.newPage()
      page.setDefaultTimeout(15000)
      page.on('pageerror', (error) => record.pageErrors.push(error.message))
      page.on('console', (message) => { if (message.type() === 'error') record.consoleErrors.push(message.text()) })
      page.on('response', (response) => { if (response.status() >= 400) record.httpErrors.push({ url: response.url(), status: response.status() }) })
      await page.addInitScript((chosen) => localStorage.setItem('pratinho-pronto-theme', chosen), theme)
      try {
        const health = await (await page.request.get(`${origin}/__qa/health`)).json()
        assert.equal(health.mode, 'local-fixtures')
        assert.equal(health.production, false)
        assert.ok((await page.request.post(`${origin}/__qa/reset?scenario=full`)).ok())
        await page.goto(origin + path)
        const trigger = page.getByRole('button', { name: triggerName }).first()
        await trigger.click()
        const dialog = page.getByRole('dialog')
        const close = dialog.getByRole('button', { name: closeName })
        await expect(close).toBeFocused()
        await page.evaluate(async () => {
          await document.fonts.ready
          await Promise.all([...document.images].map((image) => image.decode().catch(() => {})))
        })
        const raw = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
        record.axeRaw = resolve(output, 'axe-raw', `${profile}-${name}.json`)
        writeFileSync(record.axeRaw, JSON.stringify(raw, null, 2))
        record.violations = raw.violations
        record.incomplete = raw.incomplete
        record.screenshot = resolve(output, 'screenshots', `${profile}-${name}.png`)
        await page.screenshot({ path: record.screenshot, fullPage: true, animations: 'disabled' })
        assert.deepEqual(raw.violations, [], 'Confirmed axe violations remain')

        // Read every text-bearing heading, paragraph, label and button, then
        // explicitly include each indeterminate axe target. Never rewrite axe.
        const selectors = await dialog.evaluate((panel) => {
          const selectorFor = (element) => {
            const segments = []
            for (let current = element; current; current = current.parentElement) {
              if (current.id) { segments.unshift(`#${CSS.escape(current.id)}`); break }
              const siblings = current.parentElement ? [...current.parentElement.children].filter((sibling) => sibling.tagName === current.tagName) : [current]
              segments.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(current) + 1})`)
            }
            return segments.join(' > ')
          }
          return [...panel.querySelectorAll('h2,p,label,button')]
            .filter((element) => element.textContent.trim()).map(selectorFor)
        })
        const unresolvedTargets = raw.incomplete.filter((rule) => rule.id === 'color-contrast').flatMap((rule) => rule.nodes.map((node) => node.target))
        record.axeCoverage = []
        for (const target of unresolvedTargets) {
          assert.ok(target.length === 1 && typeof target[0] === 'string', 'Unsupported nested axe target')
          const locator = page.locator(target[0])
          assert.equal(await locator.count(), 1, 'Indeterminate axe target must resolve uniquely')
          const inside = await locator.evaluate((element) => Boolean(element.closest('[role="dialog"]')))
          assert.ok(inside, 'Indeterminate contrast outside the dialog needs separate review')
          record.axeCoverage.push({ target, measured: false })
          selectors.push(target[0])
        }
        for (const selector of new Set(selectors)) {
          const locator = page.locator(selector)
          await locator.scrollIntoViewIfNeeded()
          const rows = await locator.evaluate(measureRenderedContrast)
          record.measurements.push({ selector, rows })
          assert.ok(rows.length > 0, `No rendered text measured: ${selector}`)
          assert.deepEqual(rows.filter((row) => row.status !== 'passed').map(({ text, status, ratio, reasons }) => ({ text, status, ratio, reasons })), [], `Unresolved or failed supplemental check: ${selector}`)
          for (const coverage of record.axeCoverage) if (coverage.target[0] === selector) coverage.measured = true
        }
        assert.ok(record.axeCoverage.every(({ measured }) => measured), 'Every indeterminate contrast target must be measured')
        const samples = record.measurements.flatMap(({ rows }) => rows)
        const rows = [...new Map(samples.map((row) => [row.nodeKey, row])).values()]
        record.supplemental = { measurements: record.measurements.length, textSamples: samples.length, uniqueTextNodes: rows.length, minimumRatio: Math.min(...rows.map(({ ratio }) => ratio)), passed: rows.filter(({ status }) => status === 'passed').length, unresolved: rows.filter(({ status }) => status !== 'passed').length }

        // Scrolling the panel never moves focus. Exercise the real trap and
        // its invoking-element restoration without programmatic focus().
        await expect(close).toBeFocused()
        await page.keyboard.press('Shift+Tab')
        assert.ok(await dialog.evaluate((panel) => panel.contains(document.activeElement)))
        await expect(close).not.toBeFocused()
        await page.keyboard.press('Tab')
        await expect(close).toBeFocused()
        await page.keyboard.press('Escape')
        await expect(dialog).not.toBeVisible()
        await expect(trigger).toBeFocused()
        record.focus = { initial: true, backwardWrap: true, forwardWrap: true, escapeRestoration: true }
        for (const key of ['pageErrors', 'consoleErrors', 'externalRequests', 'httpErrors']) assert.deepEqual(record[key], [], key)
        record.status = 'passed'
      } catch (error) {
        record.status = 'failed'
        record.error = error.message
        await page.screenshot({ path: resolve(output, 'screenshots', `${profile}-${name}-failed.png`), fullPage: true }).catch(() => {})
      } finally {
        results.push(record)
        appendFileSync(resolve(output, 'cases.jsonl'), `${JSON.stringify(record)}\n`)
        console.log(JSON.stringify({ browser: browserName, profile, name, status: record.status, indeterminate: record.axeCoverage?.length, supplemental: record.supplemental, error: record.error }))
        await context.close()
      }
    }
  }
} finally { await browser.close() }
const persisted = readFileSync(resolve(output, 'cases.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line))
assert.deepEqual(persisted, results, 'Per-case evidence differs from the aggregate')
const expectedKeys = profiles.flatMap(([profile]) => scenarios.map(([name]) => `${profile}/${name}`)).sort()
assert.deepEqual(persisted.map(({ profile, name }) => `${profile}/${name}`).sort(), expectedKeys)
const summary = { label, browser: browserName, version, expected: expectedKeys.length, completed: results.length, passed: results.filter(({ status }) => status === 'passed').length, results }
writeFileSync(resolve(output, 'dialogs.json'), JSON.stringify(summary, null, 2))
console.log(JSON.stringify({ report: resolve(output, 'dialogs.json'), expected: summary.expected, completed: summary.completed, passed: summary.passed }))
if (summary.passed !== summary.expected) process.exitCode = 1
