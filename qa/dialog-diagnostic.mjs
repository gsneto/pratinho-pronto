import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const origin = 'http://127.0.0.1:4178'
const output = resolve('output/ui-qa', `dialog-diagnostic-${Date.now()}`)
mkdirSync(output, { recursive: true })
const browser = await chromium.launch()
const results = []
const scenarios = [
  ['planner', '/app/recipes/qa-recipe-mingau-de-banana-e-aveia', 'Colocar na minha semana'],
  ['replacement', '/app/week?week=2026-09-07', /^Trocar /],
]
const probes = [
  ['baseline', ''],
  ['positioned-panel', '.pp-modal { position: relative; }'],
  ['isolated-panel', '.pp-modal { isolation: isolate; }'],
  ['ordinary-wrap', '.pp-modal, .pp-modal * { text-wrap: wrap; }'],
  ['opaque-backdrop', '[role="presentation"]:has(> [role="dialog"]) { background: #223a31; }'],
  ['text-line-height', '.pp-modal button { line-height: 1.6; }'],
  ['non-scrolling-panel', '.pp-modal { overflow: visible; }'],
  ['contained-panel', '.pp-modal { contain: paint; }'],
  ['opaque-copy', '.pp-modal > div:first-child p { background: var(--pp-surface); }'],
  ['explicit-control-stacking', '.pp-modal button, .pp-modal p { position: relative; z-index: 1; }'],
]
try {
  for (const [name, path, trigger] of scenarios) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'pt-BR', serviceWorkers: 'block' })
    await context.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
    const page = await context.newPage()
    await page.addInitScript(() => localStorage.setItem('pratinho-pronto-theme', 'light'))
    await page.request.post(`${origin}/__qa/reset?scenario=full`)
    await page.goto(origin + path)
    await page.getByRole('button', { name: trigger }).first().click()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await page.evaluate(async () => {
      await document.fonts.ready
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})))
    })
    for (const [probe, css] of probes) {
      const style = css ? await page.addStyleTag({ content: css }) : null
      const audit = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
      const incomplete = audit.incomplete.flatMap((rule) => rule.nodes.map((node) => ({ target: node.target, html: node.html, checks: node.any })))
      const geometry = await page.getByRole('dialog').evaluate((dialog) => {
        const mapElement = (element) => ({ tag: element.tagName, class: element.className, text: element.textContent.trim().slice(0, 90) })
        return [...dialog.querySelectorAll('h2,p,button')].map((element) => {
          const rect = element.getBoundingClientRect()
          const style = getComputedStyle(element)
          const textRects = []
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!node.textContent.trim()) continue
            const range = document.createRange()
            range.selectNodeContents(node)
            textRects.push(...[...range.getClientRects()].map((part) => part.toJSON()))
          }
          return { ...mapElement(element), rect: rect.toJSON(), textRects, foreground: style.color, background: style.backgroundColor, fontSize: style.fontSize, lineHeight: style.lineHeight,
            stack: document.elementsFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2).slice(0, 7).map(mapElement) }
        })
      })
      const record = { name, probe, incomplete, violations: audit.violations, geometry }
      results.push(record)
      writeFileSync(resolve(output, 'diagnostic.json'), JSON.stringify({ results }, null, 2))
      console.log(JSON.stringify({ name, probe, incomplete: incomplete.map(({ target }) => target), violations: audit.violations.length }))
      if (style) await style.evaluate((element) => element.remove())
    }
    await context.close()
  }
} finally { await browser.close() }
console.log(JSON.stringify({ report: resolve(output, 'diagnostic.json') }))
