import assert from 'node:assert/strict'
import { chromium, firefox, webkit, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const origin = 'http://127.0.0.1:4178'
const label = process.argv[2] ?? `flows-${Date.now()}`
const output = resolve('output/ui-qa', label)
mkdirSync(resolve(output, 'screenshots'), { recursive: true })
mkdirSync(resolve(output, 'pdf'), { recursive: true })
const browserName = process.env.QA_BROWSER ?? 'chromium'
const browserType = { chromium, firefox, webkit }[browserName]
if (!browserType) throw new Error(`Unsupported QA_BROWSER: ${browserName}`)
const results = []
const profiles = [['desktop-light', 1440, 1000, 'light'], ['mobile-dark', 390, 844, 'dark']]
  .filter(([name]) => !process.env.QA_PROFILE || name === process.env.QA_PROFILE)
const api = async (page, table, query = '') => (await page.request.get(`${origin}/__qa/supabase/rest/v1/${table}${query ? '?' + query : ''}`)).json()
const navigate = async (page, path, selector) => { await page.goto(origin + path); await page.locator(selector).first().waitFor() }
async function audit(page, record, state) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const violations = result.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }))
  const incomplete = result.incomplete.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(({ target }) => target) }))
  record.audits ??= []; record.audits.push({ state, violations, incomplete })
  await page.screenshot({ path: resolve(output, 'screenshots', `${record.profile}-${state}.png`), fullPage: true, animations: 'disabled' })
  assert.deepEqual(violations, [], `Axe violations at ${state}`)
}
async function failOnce(page, table, method) {
  let failed = false
  await page.route(`**/rest/v1/${table}?**`, async (route) => {
    if (!failed && route.request().method() === method) {
      failed = true
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Intentional QA failure' }) })
    } else await route.continue()
  })
}
const flows = [
  ['navigation-theme', 'full', async (page, record) => {
    await navigate(page, '/app', '.pp-home')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#app-main')).toBeFocused()
    const nav = page.getByRole('navigation', { name: record.profile.startsWith('desktop') ? 'Navegação principal no desktop' : 'Navegação principal', exact: true })
    for (const [name, suffix] of [['Semana', '/week'], ['Receitas', '/recipes'], ['Despensa', '/pantry'], ['Compras', '/shopping-list'], ['Início', '']]) {
      await nav.getByRole('link', { name, exact: true }).click()
      await expect(page).toHaveURL(origin + '/app' + suffix)
    }
    const previous = await page.locator('html').getAttribute('data-theme')
    await page.getByRole('button', { name: previous === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro' }).click()
    await page.reload(); await page.locator('.pp-home').waitFor()
    await expect(page.locator('html')).toHaveAttribute('data-theme', previous === 'light' ? 'dark' : 'light')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await navigate(page, '/app/recipes', '.pp-recipe-card')
    assert.ok(Number.parseFloat(await page.locator('.pp-recipe-card').first().evaluate((element) => getComputedStyle(element).transitionDuration)) <= 0.001)
    await page.getByRole('button', { name: 'Sair da conta' }).click()
    await expect(page).toHaveURL(origin + '/login')
    await expect(page.getByRole('heading', { name: 'Entre no Pratinho Pronto' })).toBeVisible()
  }],
  ['recipes-favorites', 'full', async (page, record) => {
    await navigate(page, '/app/recipes', '.pp-recipe-card')
    await expect(page.locator('.pp-recipe-card')).toHaveCount(72)
    await page.getByRole('searchbox', { name: 'Buscar receitas' }).fill('banana')
    // Router transitions commit after fill() in WebKit; wait for visible results.
    await expect.poll(async () => {
      const count = await page.locator('.pp-recipe-card').count()
      return count > 0 && count < 72
    }, { message: 'The banana filter must reduce the visible recipe catalog' }).toBe(true)
    await page.getByRole('button', { name: 'Filtros de idade e tempo' }).click()
    await page.getByLabel('Tempo de preparo').selectOption('15')
    await page.getByLabel('Idade mínima cadastrada').selectOption('6')
    await audit(page, record, 'recipe-filters')
    const first = page.locator('.pp-recipe-card').first()
    await first.getByRole('button', { name: /^Favoritar / }).click()
    await expect(first.getByRole('button', { name: /^Remover / })).toHaveAttribute('aria-pressed', 'true')
    const returnUrl = page.url()
    await first.getByRole('link', { name: /^Ver receita:/ }).click()
    await page.getByRole('link', { name: 'Voltar para receitas' }).click()
    await expect(page).toHaveURL(returnUrl)
    await page.getByRole('button', { name: 'Favoritas', exact: true }).click()
    await expect(page.locator('.pp-recipe-card')).toHaveCount(1)
    await page.getByRole('searchbox', { name: 'Buscar receitas' }).fill('zzzz-sem-receita')
    await expect(page.getByRole('heading', { name: 'Suas favoritas começam aqui' })).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros', exact: true }).first().click()
    await expect(page.locator('.pp-recipe-card')).toHaveCount(72)
    assert.equal((await api(page, 'recipe_favorites')).length, 1)
  }],
  ['recipe-planner', 'full', async (page, record) => {
    await navigate(page, '/app/recipes/qa-recipe-mingau-de-banana-e-aveia', '.pp-detail')
    const step = page.getByRole('button', { name: /^Etapa 1:/ })
    await step.click(); await expect(step).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Recomeçar preparo' }).click()
    await expect(step).toHaveAttribute('aria-pressed', 'false')
    const trigger = page.getByRole('button', { name: 'Colocar na minha semana' })
    await trigger.click()
    const dialog = page.getByRole('dialog')
    const close = dialog.getByRole('button', { name: 'Fechar planejamento' })
    await expect(close).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(dialog.getByRole('button', { name: 'Adicionar como opção extra' })).toBeFocused()
    await page.keyboard.press('Tab'); await expect(close).toBeFocused()
    await audit(page, record, 'recipe-planner')
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused()
    const before = (await api(page, 'meal_plans', 'week_start=eq.2026-09-14'))[0].meal_plan_items.length
    await trigger.click(); await dialog.getByRole('button', { name: 'Adicionar como opção extra' }).click()
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'entrou no' })).toBeVisible()
    assert.equal((await api(page, 'meal_plans', 'week_start=eq.2026-09-14'))[0].meal_plan_items.length, before + 1)
  }],
  ['week-replacement', 'full', async (page, record) => {
    await navigate(page, '/app/week?week=2026-09-07', '#featured-meal-title')
    await page.getByRole('link', { name: 'Ver como preparar', exact: true }).click()
    await page.locator('.pp-detail').waitFor()
    await page.getByRole('link', { name: 'Voltar para minha semana' }).click()
    await expect(page).toHaveURL(origin + '/app/week?week=2026-09-07')
    const trigger = page.getByRole('button', { name: /^Trocar / }).first()
    const previousTitle = await page.locator('#featured-meal-title').innerText()
    await trigger.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('button', { name: 'Fechar alternativas' })).toBeFocused()
    await audit(page, record, 'replace-meal')
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused()
    await trigger.click(); await failOnce(page, 'meal_plan_items', 'PATCH')
    await dialog.locator('ul button').first().click()
    await expect(dialog.getByRole('alert')).toContainText('Não conseguimos trocar')
    const replacementName = await dialog.locator('ul button .block').first().innerText()
    await dialog.locator('ul button').first().click()
    await expect(dialog).not.toBeVisible()
    await expect(page.locator('#featured-meal-title')).toHaveText(replacementName)
    assert.notEqual(previousTitle, replacementName)
    await page.reload(); await expect(page.locator('#featured-meal-title')).toHaveText(replacementName)
  }],
  ['week-generation', 'empty', async (page) => {
    await navigate(page, '/app/week', '.pp-disclosure')
    await page.getByRole('button', { name: 'Montar minha semana' }).click()
    await page.locator('#featured-meal-title').waitFor()
    const current = (await api(page, 'meal_plans'))[0]
    assert.equal(current.meal_plan_items.length, 28)
    const disclosure = page.locator('details.pp-disclosure')
    if (!await disclosure.getAttribute('open') && !(await disclosure.evaluate((element) => element.open))) await disclosure.locator('summary').click()
    await page.getByRole('button', { name: 'Repetir na próxima semana' }).click()
    await expect(page).toHaveURL(/week=2026-09-21/)
    const copied = (await api(page, 'meal_plans', 'week_start=eq.2026-09-21'))[0]
    assert.equal(copied.meal_plan_items.length, 28)
    assert.deepEqual(copied.meal_plan_items.map((item) => item.recipe_id), current.meal_plan_items.map((item) => item.recipe_id))
    await page.getByRole('button', { name: 'Ver semana anterior' }).click()
    await expect(page).toHaveURL(/week=2026-09-14/)
  }],
  ['pantry', 'full', async (page, record) => {
    await navigate(page, '/app/pantry', '[aria-label="Buscar ingredientes"]')
    const search = page.getByRole('searchbox', { name: 'Buscar ingredientes' })
    await search.fill('maca'); await expect(page.getByRole('button', { name: 'Maçã', exact: true })).toBeVisible()
    await search.fill('')
    for (const ingredient of ['Banana', 'Aveia', 'Água']) await page.getByRole('button', { name: ingredient, exact: true }).click()
    await page.getByRole('button', { name: 'Encontrar ideias' }).click()
    await expect(page.getByRole('heading', { name: 'Resultados para sua cozinha' })).toBeFocused()
    await expect(page.getByRole('heading', { name: 'Mingau de banana e aveia', exact: true })).toBeVisible()
    await audit(page, record, 'pantry-results')
    await page.getByRole('button', { name: 'Adicionar faltantes à lista' }).first().click()
    await expect(page.getByRole('button', { name: 'Já está na sua lista' })).toBeDisabled()
    await page.getByRole('button', { name: 'Limpar tudo' }).click()
    await expect(page.getByRole('button', { name: 'Encontrar ideias' })).toBeDisabled()
  }],
  ['shopping', 'full', async (page, record) => {
    await navigate(page, '/app/shopping-list?week=2026-09-14', 'progress')
    const item = page.locator('.pp-shopping button[aria-pressed]').first()
    await failOnce(page, 'shopping_list_items', 'PATCH')
    await item.click()
    await expect(page.getByRole('alert')).toContainText('Não conseguimos atualizar')
    await expect(item).toHaveAttribute('aria-pressed', 'false')
    await item.click(); await expect(item).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('progress')).toHaveAttribute('value', '1')
    await page.reload(); await expect(page.locator('progress')).toHaveAttribute('value', '1')
    await audit(page, record, 'shopping-checked')
  }],
  ['pdf-downloads', 'full', async (page, record) => {
    await navigate(page, '/app/week?week=2026-09-14', '#featured-meal-title')
    record.pdfs = []
    for (const label of ['Imprimir cardápio', 'Receitas em PDF', 'Imprimir lista de compras']) {
      if (label === 'Imprimir lista de compras') await navigate(page, '/app/shopping-list?week=2026-09-14', 'progress')
      const downloadEvent = page.waitForEvent('download', { timeout: 45000 })
      await page.getByRole('button', { name: label, exact: true }).click()
      const download = await downloadEvent
      const path = resolve(output, 'pdf', `${record.profile}-${download.suggestedFilename()}`)
      await download.saveAs(path)
      const buffer = readFileSync(path)
      assert.equal(buffer.subarray(0, 5).toString(), '%PDF-')
      assert.ok(buffer.length > 1000)
      record.pdfs.push({ path, bytes: buffer.length })
    }
  }],
  ['profile', 'full', async (page, record) => {
    await navigate(page, '/app/profile', '#baby-name')
    const name = page.getByRole('textbox', { name: 'Nome do bebê' })
    await name.fill(''); await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(name).toHaveAttribute('aria-describedby', 'baby-name-error')
    await name.fill('Alice Prévia')
    await failOnce(page, 'babies', 'PATCH')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(page.getByRole('alert')).toContainText('Não foi possível salvar')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(page.getByRole('status')).toContainText('Informações atualizadas')
    assert.equal((await api(page, 'babies'))[0].name, 'Alice Prévia')
    await page.reload(); await expect(name).toHaveValue('Alice Prévia')
    await audit(page, record, 'profile-saved')
  }],
  ['onboarding', 'onboarding', async (page, record) => {
    await navigate(page, '/onboarding', '#baby-name')
    await page.getByRole('button', { name: 'Salvar e personalizar' }).click()
    await expect(page.locator('#baby-name')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#birth-date')).toHaveAttribute('aria-invalid', 'true')
    await audit(page, record, 'onboarding-validation')
    await page.getByRole('textbox', { name: 'Nome do bebê' }).fill('Alice')
    await page.getByLabel('Data de nascimento', { exact: true }).fill('2025-12-01')
    await page.getByRole('button', { name: 'Salvar e personalizar' }).click()
    await expect(page).toHaveURL(origin + '/app')
    await expect(page.getByRole('link', { name: 'Montar minha semana', exact: true })).toBeVisible()
    assert.equal((await api(page, 'babies'))[0].name, 'Alice')
  }],
  ['login-validation', 'full', async (page, record) => {
    await navigate(page, '/login', '#email')
    await page.getByRole('button', { name: 'Entrar no app' }).click()
    await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'true')
    await page.getByRole('button', { name: 'Mostrar senha' }).click()
    await expect(page.locator('#password')).toHaveAttribute('type', 'text')
    await page.getByRole('button', { name: 'É seu primeiro acesso? Criar senha' }).click()
    await expect(page.getByRole('heading', { name: 'Crie sua senha' })).toBeVisible()
    await expect(page.locator('#password')).toHaveAttribute('type', 'password')
    await expect(page.locator('#password')).toHaveAttribute('autocomplete', 'new-password')
    await expect(page.getByLabel('Repita a senha', { exact: true })).toBeVisible()
    await audit(page, record, 'login-first-access')
  }],
  ['error-recovery', 'full', async (page, record) => {
    await page.route('**/rest/v1/recipes?**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Intentional QA failure' }) }))
    await page.goto(origin + '/app/recipes')
    await page.getByRole('heading', { name: 'As receitas não carregaram' }).waitFor({ timeout: 30000 })
    await page.unroute('**/rest/v1/recipes?**')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.locator('.pp-recipe-card')).toHaveCount(72)
    await navigate(page, '/app/recipes/qa-recipe-does-not-exist', '[role="alert"]')
    await expect(page.getByRole('heading', { name: 'Receita não encontrada' })).toBeVisible()
    await audit(page, record, 'recipe-not-found')
    await page.getByRole('link', { name: 'Voltar para receitas' }).click()
    await expect(page.locator('.pp-recipe-card')).toHaveCount(72)
  }],
]
const selectedFlows = flows.filter(([name]) => !process.env.QA_FLOW || process.env.QA_FLOW.split(',').includes(name))
if (!profiles.length || !selectedFlows.length) throw new Error('QA filters selected no cases')
const browser = await browserType.launch()
try {
  for (const [profile, width, height, theme] of profiles) {
    for (const [name, scenario, exercise] of selectedFlows) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: width <= 600 && browserName !== 'firefox', hasTouch: width <= 900, colorScheme: theme, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block', acceptDownloads: true })
      const record = { profile, name, scenario, status: 'pending', pageErrors: [], consoleErrors: [], externalRequests: [], failedResponses: [] }
      await context.route('**/*', async (route) => {
        if (new URL(route.request().url()).origin !== origin) { record.externalRequests.push(route.request().url()); await route.abort(); return }
        await route.continue()
      })
      const page = await context.newPage()
      page.setDefaultTimeout(10000)
      page.on('pageerror', (error) => record.pageErrors.push(error.message))
      page.on('console', (message) => { if (message.type() === 'error') record.consoleErrors.push(message.text()) })
      page.on('response', (response) => { if (response.status() >= 400) record.failedResponses.push({ url: response.url(), status: response.status() }) })
      await page.addInitScript((chosen) => { if (!localStorage.getItem('pratinho-pronto-theme')) localStorage.setItem('pratinho-pronto-theme', chosen) }, theme)
      try {
        await page.request.post(`${origin}/__qa/reset?scenario=${scenario}`)
        await exercise(page, record)
        assert.deepEqual(record.pageErrors, [])
        assert.deepEqual(record.externalRequests, [])
        record.unexpectedConsoleErrors = record.consoleErrors.filter((message) => !message.includes('503 (Service Unavailable)'))
        assert.deepEqual(record.unexpectedConsoleErrors, [])
        assert.ok(record.failedResponses.every((response) => response.status === 503), 'Unexpected HTTP failure')
        record.status = 'passed'
      } catch (error) {
        record.status = 'failed'; record.error = error.message
        record.screenshot = resolve(output, 'screenshots', `${profile}-${name}-failed.png`)
        await page.screenshot({ path: record.screenshot, fullPage: true }).catch(() => {})
      } finally {
        results.push(record)
        appendFileSync(resolve(output, 'cases.jsonl'), JSON.stringify(record) + '\n')
        console.log(JSON.stringify({ profile, name, status: record.status, error: record.error }))
        await context.close()
      }
    }
  }
} finally { await browser.close() }
const summary = { browser: browserName, version: browser.version(), expected: selectedFlows.length * profiles.length, completed: results.length, passed: results.filter((record) => record.status === 'passed').length, results }
writeFileSync(resolve(output, 'flows.json'), JSON.stringify(summary, null, 2))
console.log(JSON.stringify({ report: resolve(output, 'flows.json'), expected: summary.expected, completed: summary.completed, passed: summary.passed }))
if (summary.passed !== summary.expected) process.exitCode = 1
