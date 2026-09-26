// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { testBaby, testPlan, testRecipe } from '../../test/fixtures'
import { MealPlanPage } from './MealPlanPage'
import { duplicateMealPlan, replaceMealPlanItem } from '../../services/mealPlans'

vi.mock('../../hooks/useBaby', () => ({ useBaby: () => ({ data: testBaby }) }))
vi.mock('../../hooks/useRecipes', () => ({ useRecipes: () => ({ data: [testRecipe, { ...testRecipe, id: 'alternative', name: 'Outra receita de teste' }], isLoading: false }) }))
vi.mock('../../hooks/useMealPlan', () => ({ useMealPlan: () => ({ data: testPlan }), mealPlanQueryKey: (id: string, week: string) => ['plan', id, week] }))
vi.mock('../../hooks/useMealPlanHistory', () => ({ useMealPlanHistory: () => ({ data: [] }), mealPlanHistoryQueryKey: (id: string) => ['history', id] }))
vi.mock('../../components/pdf/PdfExportButton', () => ({ PdfExportButton: ({ label }: { label: string }) => <button>{label}</button> }))
vi.mock('../../services/analytics', () => ({ analytics: { track: vi.fn() } }))
vi.mock('../../services/mealPlans', () => ({ saveMealPlan: vi.fn(), duplicateMealPlan: vi.fn(), replaceMealPlanItem: vi.fn() }))
afterEach(cleanup)

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
