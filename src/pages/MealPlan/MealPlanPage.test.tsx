// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { testBaby, testPlan, testRecipe } from '../../test/fixtures'
import { MealPlanPage } from './MealPlanPage'
import { duplicateMealPlan, getMealPlan, replaceMealPlanItem, swapMealPlanItemPositions } from '../../services/mealPlans'

vi.mock('../../hooks/useBaby', () => ({ useBaby: () => ({ data: testBaby }) }))
vi.mock('../../hooks/useRecipes', () => ({ useRecipes: () => ({ data: [testRecipe, { ...testRecipe, id: 'alternative', name: 'Outra receita de teste' }], isLoading: false }) }))
const planOverride = vi.hoisted(() => ({ current: null as unknown }))
vi.mock('../../hooks/useMealPlan', () => ({ useMealPlan: () => ({ data: planOverride.current ?? testPlan }), mealPlanQueryKey: (id: string, week: string) => ['plan', id, week] }))
vi.mock('../../hooks/useMealPlanHistory', () => ({ useMealPlanHistory: () => ({ data: [] }), mealPlanHistoryQueryKey: (id: string) => ['history', id] }))
vi.mock('../../components/pdf/PdfExportButton', () => ({ PdfExportButton: ({ label }: { label: string }) => <button>{label}</button> }))
vi.mock('../../services/analytics', () => ({ analytics: { track: vi.fn() } }))
vi.mock('../../services/mealPlans', () => ({ saveMealPlan: vi.fn(), duplicateMealPlan: vi.fn(), getMealPlan: vi.fn(), replaceMealPlanItem: vi.fn(), swapMealPlanItemPositions: vi.fn() }))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  planOverride.current = null
})

function renderWeek() {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/app/week?week=2026-09-14']}><MealPlanPage /></MemoryRouter></QueryClientProvider>)
}

it('puts saved meals before the collapsible planning controls and preserves every weekday', () => {
  renderWeek()
  const controls = screen.getByText('Ajustar meu planejamento').closest('details')
  expect(controls?.open).toBe(false)
  const days = within(screen.getByRole('navigation', { name: 'Dias da semana' })).getAllByRole('button')
  expect(days).toHaveLength(7)
  fireEvent.click(days[0])
  expect(screen.getByRole('link', { name: 'Ver como preparar' }).getAttribute('href')).toBe(`/app/recipes/${testRecipe.id}`)
  expect(screen.getByRole('link', { name: 'Gerar lista de compras' }).getAttribute('href')).toContain('week=2026-09-14')
})

it('reports an offline duplication without discarding the current week', async () => {
  vi.mocked(duplicateMealPlan).mockRejectedValueOnce(new Error('offline'))
  renderWeek()
  screen.getByText('Ajustar meu planejamento').closest('details')!.open = true
  fireEvent.click(screen.getByRole('button', { name: 'Repetir na próxima semana' }))
  expect((await screen.findByRole('alert')).textContent).toMatch(/Não conseguimos repetir/)
  expect(screen.getByRole('link', { name: 'Gerar lista de compras' }).getAttribute('href')).toContain('week=2026-09-14')
})

it('confirma antes de refazer uma semana que já existe', async () => {
  renderWeek()
  screen.getByText('Ajustar meu planejamento').closest('details')!.open = true
  fireEvent.click(screen.getByRole('button', { name: 'Refazer esta semana' }))
  expect(await screen.findByRole('dialog')).toBeTruthy()
  expect(screen.getByText(/substitui o que já está planejado/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Refazer a semana' }))
  await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
})

it('pede confirmação antes de substituir um cardápio já existente na próxima semana', async () => {
  vi.mocked(getMealPlan).mockResolvedValueOnce({ ...testPlan, id: 'next-plan', week_start: '2026-09-21' })
  renderWeek()
  screen.getByText('Ajustar meu planejamento').closest('details')!.open = true
  fireEvent.click(screen.getByRole('button', { name: 'Repetir na próxima semana' }))
  expect(await screen.findByRole('dialog')).toBeTruthy()
  expect(screen.getByText(/já tem um cardápio/)).toBeTruthy()
  expect(duplicateMealPlan).not.toHaveBeenCalled()
})

it('confirma e substitui a próxima semana quando ela já tem cardápio', async () => {
  vi.mocked(getMealPlan).mockResolvedValueOnce({ ...testPlan, id: 'next-plan', week_start: '2026-09-21' })
  vi.mocked(duplicateMealPlan).mockResolvedValueOnce('next-plan')
  renderWeek()
  screen.getByText('Ajustar meu planejamento').closest('details')!.open = true
  fireEvent.click(screen.getByRole('button', { name: 'Repetir na próxima semana' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Substituir e repetir' }))
  await vi.waitFor(() => expect(duplicateMealPlan).toHaveBeenCalledWith(testBaby.id, '2026-09-14', '2026-09-21'))
})

it('returns to the exact replacement trigger after a non-focusing pointer click', () => {
  renderWeek()
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Dias da semana' })).getAllByRole('button')[0])
  const trigger = screen.getByRole('button', { name: `Trocar ${testRecipe.name}` })
  expect(document.activeElement === trigger).toBe(false)
  fireEvent.click(trigger)
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement === trigger).toBe(true)
})

it('keeps a failed replacement in the dialog with a retryable error', async () => {
  vi.mocked(replaceMealPlanItem).mockRejectedValueOnce(new Error('offline'))
  renderWeek()
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Dias da semana' })).getAllByRole('button')[0])
  fireEvent.click(screen.getByRole('button', { name: `Trocar ${testRecipe.name}` }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Outra receita de teste/ }))
  expect((await within(screen.getByRole('dialog')).findByRole('alert')).textContent).toMatch(/Não conseguimos trocar/)
})

it('marca a segunda refeição do mesmo tipo como opção extra', () => {
  const base = testPlan.meal_plan_items[0]
  planOverride.current = {
    ...testPlan,
    meal_plan_items: [
      base,
      { ...base, id: 'extra-meal', position: 1, recipe: { ...testRecipe, id: 'extra-recipe', name: 'Omelete extra' } },
    ],
  }
  renderWeek()
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Dias da semana' })).getAllByRole('button')[0])
  expect(screen.getByText('Opção extra')).toBeTruthy()
  expect(screen.getByText('Omelete extra')).toBeTruthy()
})

function renderTwoBreakfasts() {
  const base = testPlan.meal_plan_items[0]
  planOverride.current = {
    ...testPlan,
    meal_plan_items: [
      base,
      { ...base, id: 'extra-meal', position: 1, recipe: { ...testRecipe, id: 'extra-recipe', name: 'Omelete extra' } },
    ],
  }
  renderWeek()
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Dias da semana' })).getAllByRole('button')[0])
}

it('reordena refeições do mesmo tipo dentro do dia', async () => {
  vi.mocked(swapMealPlanItemPositions).mockResolvedValueOnce(undefined)
  renderTwoBreakfasts()
  fireEvent.click(screen.getByRole('button', { name: 'Mover Omelete extra para cima' }))
  await vi.waitFor(() => expect(swapMealPlanItemPositions).toHaveBeenCalledTimes(1))
  const [first, second] = vi.mocked(swapMealPlanItemPositions).mock.calls[0]
  expect([first.id, second.id].sort()).toEqual(['extra-meal', 'test-meal'])
})

it('não oferece reordenação entre tipos de refeição diferentes', () => {
  renderWeek()
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Dias da semana' })).getAllByRole('button')[0])
  // O cardápio de teste tem só um café da manhã: nada a reordenar.
  expect(screen.queryByRole('button', { name: /^Mover / })).toBeNull()
})

it('informa quando a reordenação falha e não promete sucesso', async () => {
  vi.mocked(swapMealPlanItemPositions).mockRejectedValueOnce(new Error('offline'))
  renderTwoBreakfasts()
  fireEvent.click(screen.getByRole('button', { name: 'Mover Omelete extra para cima' }))
  expect((await screen.findByRole('alert')).textContent).toMatch(/Não conseguimos reordenar/)
})
