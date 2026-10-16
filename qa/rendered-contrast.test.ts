import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { measureRenderedContrast } from './rendered-contrast.mjs'

describe.each(['chromium', 'firefox', 'webkit'] as const)('%s rendered contrast', (engine) => {
  let browser: Browser
  let context: BrowserContext
  let page: Page
  beforeAll(async () => { browser = await { chromium, firefox, webkit }[engine].launch() })
  beforeEach(async () => {
    context = await browser.newContext({ viewport: { width: 800, height: 600 } })
    await context.route('**/*', (route) => route.abort())
    page = await context.newPage()
  })
  afterEach(async () => { await context.close() })
  afterAll(async () => { await browser.close() })

  it('rejects white-on-white text and measures readable text in a real browser', async () => {
    await page.setContent('<main id="sample" style="background: white; padding: 24px; font: 16px Arial"><p style="color: white">Unreadable sample</p><p style="color: black">Readable sample</p></main>')
    const rows = await page.locator('#sample').evaluate(measureRenderedContrast)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ text: 'Unreadable sample', status: 'failed', ratio: 1, requiredRatio: 4.5 })
    expect(rows[1]).toMatchObject({ text: 'Readable sample', status: 'passed', ratio: 21, requiredRatio: 4.5 })
  })

  it('composites transparent foreground and background layers before comparing luminance', async () => {
    await page.setContent('<main id="sample" style="background: black; padding: 24px; font: 16px Arial"><p style="background: rgba(255,255,255,0.5); color: rgba(0,0,0,0.5)">Layered sample</p></main>')
    const [row] = await page.locator('#sample').evaluate(measureRenderedContrast)
    expect(row.background).toMatchObject({ red: 127.5, green: 127.5, blue: 127.5, alpha: 1 })
    expect(row.foreground).toMatchObject({ red: 63.75, green: 63.75, blue: 63.75, alpha: 1 })
    expect(row.status).toBe('failed')
  })

  it('does not approve text covered by another element and omits non-rendered text', async () => {
    await page.setContent('<main id="sample" style="position: relative; background: white; padding: 24px; color: black; font: 16px Arial"><p>Covered sample</p><p style="display:none">Hidden sample</p><div style="position:absolute; inset:0; z-index:2; background: white"></div></main>')
    const rows = await page.locator('#sample').evaluate(measureRenderedContrast)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ text: 'Covered sample', status: 'incomplete' })
    expect(rows[0].reasons).toContain('occluded-text')
    expect(rows[0].samples.some((sample) => sample.visible === false)).toBe(true)
  })

  it('leaves image backgrounds and group opacity indeterminate rather than guessing a pass', async () => {
    await page.setContent('<main id="sample" style="background:white; padding:24px; color:black; font:16px Arial"><p style="background:linear-gradient(white,black)">Gradient sample</p><div style="opacity:.5"><p style="background:white">Opacity sample</p></div></main>')
    const rows = await page.locator('#sample').evaluate(measureRenderedContrast)
    expect(rows).toHaveLength(2)
    expect(rows.every((row) => row.status === 'incomplete')).toBe(true)
    expect(rows[0].reasons).toContain('non-solid-background')
    expect(rows[1].reasons).toContain('unsupported-paint-effect')
  })

  it('uses the large-text threshold only for qualifying font size and weight', async () => {
    await page.setContent('<main id="sample" style="background:white; padding:24px; color:#777; font-family:Arial"><p style="font-size:24px">Large regular</p><p style="font-size:19px; font-weight:700">Large bold</p><p style="font-size:19px; font-weight:600">Small semibold</p></main>')
    const rows = await page.locator('#sample').evaluate(measureRenderedContrast)
    expect(rows.map(({ status, requiredRatio }) => ({ status, requiredRatio }))).toEqual([
      { status: 'passed', requiredRatio: 3 }, { status: 'passed', requiredRatio: 3 }, { status: 'failed', requiredRatio: 4.5 },
    ])
    expect(rows[2].ratio).toBeLessThan(4.5)
    expect(rows[2].ratio).toBeGreaterThan(4.4)
  })

  it('rejects unsupported color notation without substituting an assumed canvas color', async () => {
    await page.setContent('<main id="sample" style="padding:24px; color:black; font:16px Arial"><p>Unknown canvas</p><p style="background:white; color:color(display-p3 1 0 0)">Wide gamut</p></main>')
    const rows = await page.locator('#sample').evaluate(measureRenderedContrast)
    expect(rows.every((row) => row.status === 'incomplete')).toBe(true)
    expect(rows[0].reasons).toContain('unresolved-background')
    expect(rows[1].reasons).toContain('unsupported-foreground-color')
  })

  it('measures wrapped text on an opaque modal without using unrelated content behind it', async () => {
    await page.setContent('<div style="background:linear-gradient(white,black); height:400px"><p>Content behind</p></div><section id="sample" style="position:fixed; left:80px; top:80px; width:180px; padding:20px; background:white; color:black; font:16px Arial"><p>This label wraps across several lines above unrelated background content.</p></section>')
    const rows = await page.locator('#sample').evaluate(measureRenderedContrast)
    expect(rows).toHaveLength(1)
    expect(rows[0].rects.length).toBeGreaterThan(1)
    expect(rows[0]).toMatchObject({ status: 'passed', ratio: 21, reasons: [] })
    expect(rows[0].samples.every((sample) => sample.visible)).toBe(true)
  })

  it('identifies the same text node across overlapping measurement targets', async () => {
    await page.setContent('<main id="sample" style="background:white; padding:24px; color:black; font:16px Arial"><p>Outer <span id="nested">Inner text</span></p></main>')
    const full = await page.locator('#sample').evaluate(measureRenderedContrast)
    const nested = await page.locator('#nested').evaluate(measureRenderedContrast)
    expect(nested[0].nodeKey).toEqual(expect.any(String))
    expect(full.find((row) => row.text === 'Inner text')?.nodeKey).toBe(nested[0].nodeKey)
    expect(new Set(full.map(({ nodeKey }) => nodeKey)).size).toBe(full.length)
  })
})
