import assert from 'node:assert/strict'
import { chromium, firefox, webkit, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const origin = 'http://127.0.0.1:4178'
const browserName = process.env.QA_BROWSER ?? 'chromium'
const browserType = { chromium, firefox, webkit }[browserName]
assert.ok(browserType, `Unsupported QA_BROWSER: ${browserName}`)
const label = process.argv[2] ?? `pwa-install-${Date.now()}`
assert.match(label, /^[a-zA-Z0-9_-]+$/, 'Use a simple, unique evidence label')
const output = resolve('output/ui-qa', label, 'browsers', browserName)
assert.ok(!existsSync(output), `Evidence directory already exists: ${output}`)
for (const directory of ['screenshots', 'axe-raw']) mkdirSync(resolve(output, directory), { recursive: true })
const profiles = [
  ['desktop-light', 1440, 1000, 'light'],
  ['mobile-dark', 390, 844, 'dark'],
  ['narrow-light', 320, 740, 'light'],
].filter(([name]) => !process.env.QA_PROFILE || name === process.env.QA_PROFILE)

const cardName = 'Tenha o Pratinho Pronto na tela inicial'
const cardFor = (page) => page.getByRole('region', { name: cardName, exact: true })
const manualButton = (page) => cardFor(page).getByRole('button', { name: 'Como adicionar', exact: true })
const installButton = (page) => cardFor(page).getByRole('button', { name: 'Instalar aplicativo', exact: true })
const pendingButton = (page) => cardFor(page).getByRole('button', { name: 'Abrindo instalação…', exact: true })

async function navigate(page, path = '/app/profile') {
  await page.goto(origin + path)
  await expect(cardFor(page)).toBeVisible()
  await expect(manualButton(page)).toBeEnabled()
}

async function offer(page, mode) {
  const canceled = await page.evaluate((choiceMode) => window.__pwaQa.offer(choiceMode), mode)
  assert.equal(canceled, true, 'The app must defer the synthetic browser offer')
  await expect(installButton(page)).toBeEnabled()
  await expect(installButton(page)).not.toHaveAttribute('aria-expanded')
}

async function audit(page, record, state) {
  await page.evaluate(() => document.fonts.ready)
  const card = cardFor(page)
  await card.scrollIntoViewIfNeeded()
  const raw = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const axePath = resolve(output, 'axe-raw', `${record.profile}-${record.name}-${state}.json`)
  writeFileSync(axePath, JSON.stringify(raw, null, 2))
  const screenshot = resolve(output, 'screenshots', `${record.profile}-${record.name}-${state}.png`)
  await card.screenshot({ path: screenshot, animations: 'disabled' })
  const documentBounds = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }))
  record.audits.push({ state, axePath, screenshot, violations: raw.violations, incomplete: raw.incomplete, documentBounds })
  assert.deepEqual(raw.violations, [], `Axe violations at ${state}`)
  assert.ok(documentBounds.content <= documentBounds.viewport + 1, `Horizontal document overflow at ${state}`)
}

async function assertManualTarget(page, expanded) {
  const button = manualButton(page)
  await expect(button).toHaveAttribute('aria-expanded', String(expanded))
  const target = await button.getAttribute('aria-controls')
  assert.ok(target)
  const semantics = await button.evaluate((element) => {
    const controlled = document.getElementById(element.getAttribute('aria-controls'))
    return { exists: Boolean(controlled), ownCard: controlled?.closest('section') === element.closest('section'), hidden: controlled?.hidden }
  })
  assert.deepEqual(semantics, { exists: true, ownCard: true, hidden: !expanded })
  return cardFor(page).getByRole('status')
}

const scenarios = [
  ['manual-keyboard', async (page, record) => {
    await navigate(page)
    await assertManualTarget(page, false)
    await manualButton(page).focus()
    await page.keyboard.press('Enter')
    const status = await assertManualTarget(page, true)
    await expect(status).toContainText('No seu navegador:')
    await expect(manualButton(page)).toBeFocused()
    await audit(page, record, 'expanded')
    await page.keyboard.press('Space')
    await assertManualTarget(page, false)
    await expect(status).toBeHidden()
    await expect(manualButton(page)).toBeFocused()
    assert.equal(await page.evaluate(() => window.__pwaQa.calls), 0)
  }],
  ['ios-instructions', async (page, record) => {
    await navigate(page)
    await manualButton(page).click()
    const status = await assertManualTarget(page, true)
    await expect(status).toContainText('No iPhone ou iPad:')
    await expect(status.getByRole('listitem')).toHaveCount(3)
    await audit(page, record, 'manual-ios-user-agent')
    assert.equal(await page.evaluate(() => window.__pwaQa.calls), 0)
  }],
  ['rejected-recovery', async (page, record) => {
    await navigate(page)
    await offer(page, 'rejected')
    await installButton(page).click()
    await expect(cardFor(page).getByRole('alert')).toContainText('Não foi possível abrir a instalação')
    await expect(manualButton(page)).toBeEnabled()
    await expect(manualButton(page)).toHaveAttribute('aria-busy', 'false')
    await assertManualTarget(page, true)
    assert.equal(await page.evaluate(() => window.__pwaQa.calls), 1)
    await audit(page, record, 'failure-recovered')
    await manualButton(page).click()
    await expect(cardFor(page).getByRole('alert')).toHaveCount(0)
    await assertManualTarget(page, false)
    await offer(page, 'dismissed')
    await installButton(page).click()
    await expect(manualButton(page)).toBeEnabled()
    assert.equal(await page.evaluate(() => window.__pwaQa.calls), 2)
  }],
  ['dismissed-accepted-installed', async (page, record) => {
    await navigate(page)
    await offer(page, 'dismissed')
    await installButton(page).click()
    await expect(manualButton(page)).toBeEnabled()
    await expect(cardFor(page).getByRole('alert')).toHaveCount(0)
    await assertManualTarget(page, false)
    await offer(page, 'accepted')
    await installButton(page).click()
    await expect(manualButton(page)).toBeEnabled()
    await expect(cardFor(page)).toBeVisible()
    assert.equal(await page.evaluate(() => window.__pwaQa.calls), 2)
    await audit(page, record, 'accepted-is-not-installed')
    await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')))
    await expect(cardFor(page)).toHaveCount(0)
    const ignored = await page.evaluate(() => window.__pwaQa.offer('dismissed'))
    assert.equal(ignored, false, 'An already-installed session must ignore subsequent offers')
    await expect(cardFor(page)).toHaveCount(0)
    assert.equal(await page.evaluate(() => window.__pwaQa.calls), 2)
  }],
  ['pending-across-route', async (page, record) => {
    await navigate(page, '/app')
    await offer(page, 'pending')
    await installButton(page).click()
    await expect(pendingButton(page)).toBeDisabled()
    await expect(pendingButton(page)).toHaveAttribute('aria-busy', 'true')
    await pendingButton(page).evaluate((button) => { button.click(); button.click() })
    assert.equal(await page.evaluate(() => window.__pwaQa.calls), 1)
    await page.locator('header').getByRole('link', { name: 'Perfil do bebê', exact: true }).click()
    await expect(page).toHaveURL(origin + '/app/profile')
    // Router updates location before replacing the previous route's same-named card.
    await expect(page.locator('.pp-profile-hero')).toBeVisible()
    await expect(pendingButton(page)).toBeDisabled()
    await expect(pendingButton(page)).toHaveAttribute('aria-busy', 'true')
    await audit(page, record, 'pending-remounted-card')
    await page.evaluate(() => window.__pwaQa.finish('dismissed'))
    await expect(manualButton(page)).toBeEnabled()
    await expect(manualButton(page)).toHaveAttribute('aria-busy', 'false')
    assert.equal(await page.evaluate(() => window.__pwaQa.calls), 1)
    await manualButton(page).click()
    await assertManualTarget(page, true)
  }],
  ['home-dismiss-keeps-profile', async (page, record) => {
    await navigate(page, '/app')
    await cardFor(page).getByRole('button', { name: 'Fechar convite para instalar' }).click()
    await expect(cardFor(page)).toHaveCount(0)
    await page.reload()
    await expect(page.locator('.pp-home')).toBeVisible()
    await expect(cardFor(page)).toHaveCount(0)
    await page.locator('header').getByRole('link', { name: 'Perfil do bebê', exact: true }).click()
    await expect(page.locator('.pp-profile-hero')).toBeVisible()
    await expect(manualButton(page)).toBeEnabled()
    await manualButton(page).click()
    await assertManualTarget(page, true)
    await audit(page, record, 'profile-after-home-dismiss')
  }],
].filter(([name]) => !process.env.QA_PWA_CASE || process.env.QA_PWA_CASE.split(',').includes(name))
assert.ok(profiles.length && scenarios.length, 'QA filters selected no cases')

const results = []
const browser = await browserType.launch()
const version = browser.version()
try {
  for (const [profile, width, height, theme] of profiles) {
    for (const [name, exercise] of scenarios) {
      const context = await browser.newContext({
        viewport: { width, height }, hasTouch: width <= 900, colorScheme: theme,
        ...(browserName !== 'firefox' ? { isMobile: width <= 600 } : {}),
        locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce',
        serviceWorkers: 'block', acceptDownloads: false,
      })
      const record = { browser: browserName, profile, name, theme, viewport: { width, height }, status: 'pending', syntheticEvents: true, nativeInstallPerformed: false, iosUserAgentEmulated: name === 'ios-instructions', pageErrors: [], consoleErrors: [], httpErrors: [], externalRequests: [], audits: [] }
      await context.route('**/*', async (route) => {
        if (new URL(route.request().url()).origin === origin) await route.continue()
        else { record.externalRequests.push(route.request().url()); await route.abort() }
      })
      await context.addInitScript(({ chosenTheme, emulateIos }) => {
        localStorage.setItem('pratinho-pronto-theme', chosenTheme)
        if (emulateIos) Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'QA synthetic iPhone user agent' })
        // Never expose a real operating-system installation prompt in this suite.
        window.addEventListener('beforeinstallprompt', (event) => {
          if (event.isTrusted) { event.preventDefault(); event.stopImmediatePropagation() }
        }, true)
        window.__pwaQa = {
          calls: 0,
          finish: null,
          offer(mode) {
            let finish
            const choice = mode === 'pending'
              ? new Promise((resolveChoice) => { finish = resolveChoice })
              : Promise.resolve({ outcome: mode === 'accepted' ? 'accepted' : 'dismissed', platform: 'web' })
            this.finish = (outcome) => finish?.({ outcome, platform: 'web' })
            const event = new Event('beforeinstallprompt', { cancelable: true })
            Object.assign(event, {
              userChoice: choice,
              prompt: () => {
                this.calls += 1
                return mode === 'rejected' ? Promise.reject(new Error('QA synthetic install rejection')) : choice
              },
            })
            window.dispatchEvent(event)
            return event.defaultPrevented
          },
        }
      }, { chosenTheme: theme, emulateIos: name === 'ios-instructions' })
      const page = await context.newPage()
      page.setDefaultTimeout(12000)
      page.on('pageerror', (error) => record.pageErrors.push(error.message))
      page.on('console', (message) => { if (message.type() === 'error') record.consoleErrors.push(message.text()) })
      page.on('response', (response) => { if (response.status() >= 400) record.httpErrors.push({ url: response.url(), status: response.status() }) })
      try {
        const health = await (await page.request.get(`${origin}/__qa/health`)).json()
        assert.equal(health.mode, 'local-fixtures')
        assert.equal(health.production, false)
        assert.ok((await page.request.post(`${origin}/__qa/reset?scenario=full`)).ok())
        await exercise(page, record)
        assert.deepEqual(record.pageErrors, [], 'Unexpected page error')
        assert.deepEqual(record.consoleErrors, [], 'Unexpected console error')
        assert.deepEqual(record.httpErrors, [], 'Unexpected HTTP error')
        assert.deepEqual(record.externalRequests, [], 'External network attempt')
        record.status = 'passed'
      } catch (error) {
        record.status = 'failed'
        record.error = error.stack ?? String(error)
        record.failureScreenshot = resolve(output, 'screenshots', `${profile}-${name}-failed.png`)
        await page.screenshot({ path: record.failureScreenshot, fullPage: true }).catch(() => {})
      } finally {
        results.push(record)
        appendFileSync(resolve(output, 'cases.jsonl'), JSON.stringify(record) + '\n')
        console.log(JSON.stringify({ browser: browserName, profile, name, status: record.status, error: record.error }))
        await context.close()
      }
    }
  }
} finally { await browser.close() }
const expectedKeys = profiles.flatMap(([profile]) => scenarios.map(([name]) => `${profile}/${name}`)).sort()
const keys = results.map(({ profile, name }) => `${profile}/${name}`).sort()
assert.deepEqual(keys, expectedKeys)
assert.deepEqual(readFileSync(resolve(output, 'cases.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line)), results)
const summary = { browser: browserName, version, scope: 'Synthetic install lifecycle and UI only; native install, offline and physical iOS excluded', expected: expectedKeys.length, completed: results.length, passed: results.filter(({ status }) => status === 'passed').length, results }
writeFileSync(resolve(output, 'pwa-install.json'), JSON.stringify(summary, null, 2))
console.log(JSON.stringify({ report: resolve(output, 'pwa-install.json'), expected: summary.expected, completed: summary.completed, passed: summary.passed }))
if (summary.passed !== summary.expected) process.exitCode = 1
