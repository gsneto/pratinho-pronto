import { chromium, firefox, webkit } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const origin = 'http://127.0.0.1:4178'
const label = process.argv[2] ?? `audit-${Date.now()}`
const output = resolve('output/ui-qa', label)
mkdirSync(resolve(output, 'screenshots'), { recursive: true })
const routes = [
  ['home', '/app', '.pp-feature-meal'],
  ['landing', '/', '.lp-offer-price'],
  ['recipes', '/app/recipes', '.pp-recipe-card'],
  ['recipe', '/app/recipes/qa-recipe-mingau-de-banana-e-aveia', '.pp-detail'],
  ['week', '/app/week?week=2026-09-14', '#featured-meal-title'],
  ['pantry', '/app/pantry', '[aria-label="Buscar ingredientes"]'],
  ['shopping', '/app/shopping-list?week=2026-09-14', 'progress'],
  ['profile', '/app/profile', '#baby-name'],
  ['login', '/login', '#email'],
  ['onboarding', '/onboarding', '#baby-name'],
]
const profiles = [
  ['desktop-light', 1440, 1000, 'light'], ['desktop-dark', 1440, 1000, 'dark'],
  ['mobile-light', 390, 844, 'light'], ['mobile-dark', 390, 844, 'dark'],
  ['narrow-light', 320, 740, 'light'], ['tablet-dark', 768, 1024, 'dark'],
].filter(([name]) => !process.env.QA_PROFILE || name === process.env.QA_PROFILE)
const selectedRoutes = routes.filter(([name]) => !process.env.QA_PAGE || name === process.env.QA_PAGE)
const browserName = process.env.QA_BROWSER ?? 'chromium'
const browserType = { chromium, firefox, webkit }[browserName]
if (!browserType) throw new Error(`Unsupported QA_BROWSER: ${browserName}`)
if (!profiles.length || !selectedRoutes.length) throw new Error('QA filters selected no cases')
const browser = await browserType.launch()
const results = []
try {
  for (const [profile, width, height, theme] of profiles) {
    for (const [name, path, ready] of selectedRoutes) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: width <= 600 && browserName !== 'firefox', hasTouch: width <= 900, colorScheme: theme, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block' })
      const consoleErrors = []; const pageErrors = []; const externalRequests = []; const httpErrors = []
      await context.route('**/*', async (route) => {
        if (new URL(route.request().url()).origin !== origin) { externalRequests.push(route.request().url()); await route.abort(); return }
        await route.continue()
      })
      const page = await context.newPage()
      await page.addInitScript((chosen) => localStorage.setItem('pratinho-pronto-theme', chosen), theme)
      page.on('pageerror', (error) => pageErrors.push(error.message))
      page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
      page.on('response', (response) => { if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() }) })
      const result = { profile, name, path, viewport: { width, height }, theme, consoleErrors, pageErrors, externalRequests, httpErrors }
      try {
        await page.request.post(`${origin}/__qa/reset?scenario=${name === 'onboarding' ? 'onboarding' : 'full'}`)
        await page.goto(origin + path)
        await page.locator(ready).first().waitFor({ timeout: 20000 })
        await page.evaluate(async () => {
          await document.fonts.ready
          await Promise.all([...document.images].map((image) => {
            image.loading = 'eager'
            return image.complete ? Promise.resolve() : new Promise((resolve) => { image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true }) })
          }))
        })
        const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
        result.violations = audit.violations.map(({ id, impact, description, helpUrl, nodes }) => ({ id, impact, description, helpUrl, nodes: nodes.map(({ target, html, failureSummary }) => ({ target, html, failureSummary })) }))
        result.incomplete = audit.incomplete.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length }))
        result.geometry = await page.evaluate(() => {
          const clipped = []
          for (const element of document.querySelectorAll('button,input,select,article,section,nav,header,h1,h2,img')) {
            const rect = element.getBoundingClientRect()
            if (!rect.width || !rect.height || getComputedStyle(element).visibility === 'hidden') continue
            if (rect.left >= -1 && rect.right <= innerWidth + 1) continue
            let parent = element.parentElement; let scrollable = false
            while (parent && parent !== document.body) { if (/auto|scroll/.test(getComputedStyle(parent).overflowX)) scrollable = true; parent = parent.parentElement }
            if (!scrollable) clipped.push({ tag: element.tagName, text: (element.getAttribute('aria-label') ?? element.textContent ?? '').trim().slice(0,100), left: rect.left, right: rect.right })
          }
          return { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, clipped }
        })
        result.brokenImages = await page.locator('img').evaluateAll((images) => images.filter((image) => image.complete && !image.naturalWidth).map((image) => image.src))
        result.headings = await page.locator('h1').allTextContents()
        result.screenshot = resolve(output, 'screenshots', `${profile}-${name}.png`)
        await page.screenshot({ path: result.screenshot, fullPage: true, animations: 'disabled' })
      } catch (error) {
        result.error = error.message
        result.screenshot = resolve(output, 'screenshots', `${profile}-${name}-failed.png`)
        await page.screenshot({ path: result.screenshot, fullPage: true }).catch(() => {})
      } finally {
        results.push(result)
        appendFileSync(resolve(output, 'cases.jsonl'), `${JSON.stringify(result)}\n`)
        console.log(JSON.stringify({ profile, name, axe: result.violations?.map((violation) => `${violation.id}:${violation.nodes.length}`), clipped: result.geometry?.clipped.length, errors: pageErrors.length + consoleErrors.length, failure: result.error }))
        await context.close()
      }
    }
  }
} finally { await browser.close() }
const failureCases = results.filter((result) => result.error || result.violations?.length || result.geometry?.clipped.length || result.geometry?.documentWidth > result.viewport.width || result.brokenImages?.length || result.pageErrors.length || result.consoleErrors.length || result.externalRequests.length || result.httpErrors.length)
const summary = { label, browser: browserName, version: browser.version(), expected: profiles.length * selectedRoutes.length, completed: results.length, failed: failureCases.length, results }
writeFileSync(resolve(output, 'audit.json'), JSON.stringify(summary, null, 2))
console.log(JSON.stringify({ report: resolve(output, 'audit.json'), expected: summary.expected, completed: results.length, failed: failureCases.length }))
if (results.length !== summary.expected || failureCases.length) process.exitCode = 1
