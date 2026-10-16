// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecipesPage } from './RecipesPage'
import { testRecipe } from '../../test/fixtures'

const recipesMock = vi.hoisted(() => ({ current: [] as unknown[] }))
const favoritesMock = vi.hoisted(() => ({ current: [] as string[] }))
const reviewMock = vi.hoisted(() => ({ current: null as Record<string, string> | null }))

vi.mock('../../hooks/useRecipes', () => ({
  useRecipes: () => ({ data: recipesMock.current, isLoading: false, error: null, refetch: vi.fn() }),
  useRecipeReviewStatuses: () => ({ data: reviewMock.current }),
}))
vi.mock('../../hooks/useFavorites', () => ({
  useFavorites: () => ({ data: favoritesMock.current }),
  useFavoriteRecipe: () => ({ isFavorite: false, isSaving: false, toggle: vi.fn() }),
}))
afterEach(() => {
  cleanup()
  recipesMock.current = []
  favoritesMock.current = []
  reviewMock.current = null
})

function renderRecipes(entry: string) {
  render(<MemoryRouter initialEntries={[entry]}><RecipesPage /></MemoryRouter>)
}

it('supports direct favorite links and meal chips, and resets every active filter', () => {
  renderRecipes('/app/recipes?favorites=true')
  const favorites = screen.getByRole('button', { name: /Favoritas/ })
  expect(favorites.getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'Almoço' }))
  expect(screen.getByRole('button', { name: 'Almoço' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getAllByRole('button', { name: /Limpar filtros/ })[0])
  expect(screen.getByRole('button', { name: 'Todas' }).getAttribute('aria-pressed')).toBe('true')
  expect(favorites.getAttribute('aria-pressed')).toBe('false')
})

it('acolhe quem ainda não tem favoritas e leva ao catálogo', () => {
  renderRecipes('/app/recipes?favorites=true')
  expect(screen.getByRole('heading', { name: 'Você ainda não salvou favoritas' })).toBeTruthy()
  expect(screen.getByText(/Toque no coração de qualquer receita/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Explorar o catálogo' }))
  expect(screen.getByRole('button', { name: /Favoritas/ }).getAttribute('aria-pressed')).toBe('false')
})

it('mantém o catálogo e o estado de favoritas quando há favoritas salvas', () => {
  favoritesMock.current = [testRecipe.id]
  recipesMock.current = [testRecipe]
  renderRecipes('/app/recipes?favorites=true')
  expect(screen.queryByRole('heading', { name: 'Você ainda não salvou favoritas' })).toBeNull()
  expect(screen.getByText(testRecipe.name)).toBeTruthy()
})

it('mostra o indicador de revisão quando o status está disponível', () => {
  recipesMock.current = [testRecipe]
  reviewMock.current = { [testRecipe.id]: 'pending_professional_review' }
  renderRecipes('/app/recipes')
  expect(screen.getByText(/Catálogo em revisão profissional/)).toBeTruthy()
  expect(screen.getByText(/1 de 1 receitas ainda aguardam revisão/)).toBeTruthy()
})

it('não mostra indicador de revisão quando o status não está disponível', () => {
  recipesMock.current = [testRecipe]
  reviewMock.current = null
  renderRecipes('/app/recipes')
  expect(screen.queryByText(/Catálogo em revisão profissional/)).toBeNull()
})
