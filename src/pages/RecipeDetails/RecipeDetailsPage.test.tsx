// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { testBaby, testRecipe } from '../../test/fixtures'
import { RecipeDetailsPage } from './RecipeDetailsPage'
import { addRecipeToMealPlan } from '../../services/mealPlans'

vi.mock('../../hooks/useBaby', () => ({ useBaby: () => ({ data: testBaby }) }))
vi.mock('../../hooks/useRecipes', () => ({ useRecipe: () => ({ data: testRecipe, isLoading: false }) }))
vi.mock('../../hooks/useMealPlan', () => ({ useMealPlan: () => ({ data: null }), mealPlanQueryKey: (id: string, week: string) => ['plan', id, week] }))
vi.mock('../../hooks/useFavorites', () => ({ useFavoriteRecipe: () => ({ isFavorite: false, isSaving: false, toggle: vi.fn() }) }))
vi.mock('../../services/mealPlans', () => ({ addRecipeToMealPlan: vi.fn() }))
afterEach(cleanup)
beforeEach(() => vi.clearAllMocks())

function renderRecipe() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/app/recipes/test-recipe']}>
        <Routes><Route path="/app/recipes/:recipeId" element={<RecipeDetailsPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

it('preserves the source guidance without inferring texture or freezing permission', () => {
  renderRecipe()
  expect(screen.getByText(testRecipe.storage_notes!)).toBeTruthy()
  expect(screen.queryByText('Sim, em porções')).toBeNull()
  expect(screen.queryByText('Textura sugerida')).toBeNull()
  expect(screen.getByText('Demonstrativa')).toBeTruthy()
})

it('lets the cook check and restart steps without changing their instructions', () => {
  renderRecipe()
  const first = screen.getByRole('button', { name: 'Etapa 1: Separe os ingredientes.' })
  expect(first.getAttribute('aria-pressed')).toBe('false')
  fireEvent.click(first)
  expect(first.getAttribute('aria-pressed')).toBe('true')
  expect(screen.getByRole('status').textContent).toBe('1 de 2 etapas concluídas')
  fireEvent.click(screen.getByRole('button', { name: 'Recomeçar preparo' }))
  expect(first.getAttribute('aria-pressed')).toBe('false')
  expect(screen.getByRole('status').textContent).toBe('0 de 2 etapas concluídas')
})

it('keeps the planner open and reports a failed save without a success claim', async () => {
  vi.mocked(addRecipeToMealPlan).mockRejectedValueOnce(new Error('offline'))
  renderRecipe()
  fireEvent.click(screen.getByRole('button', { name: 'Colocar na minha semana' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Colocar na / }))
  expect((await screen.findByRole('alert')).textContent).toMatch(/Não conseguimos salvar/)
  expect(screen.getByRole('dialog')).toBeTruthy()
  expect(screen.queryByText(/entrou no café/)).toBeNull()
})

it('does not claim a copied link when the clipboard API is unavailable', async () => {
  renderRecipe()
  fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))
  expect(await screen.findByText('Você pode copiar o endereço desta receita pelo navegador.')).toBeTruthy()
  expect(screen.queryByText('Link copiado para compartilhar.')).toBeNull()
})

it('returns to the planner trigger even when a pointer click did not focus it', () => {
  renderRecipe()
  const trigger = screen.getByRole('button', { name: 'Colocar na minha semana' })
  expect(document.activeElement).not.toBe(trigger)
  fireEvent.click(trigger)
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
})

it('traps keyboard focus in the planner and restores the trigger after closing', async () => {
  const user = userEvent.setup()
  renderRecipe()
  const trigger = screen.getByRole('button', { name: 'Colocar na minha semana' })
  await user.click(trigger)
  const close = screen.getByRole('button', { name: 'Fechar planejamento' })
  expect(document.activeElement).toBe(close)
  await user.tab({ shift: true })
  expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
})
