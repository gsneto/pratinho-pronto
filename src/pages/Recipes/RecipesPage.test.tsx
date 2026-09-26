// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecipesPage } from './RecipesPage'
vi.mock('../../hooks/useRecipes', () => ({ useRecipes: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }) }))
vi.mock('../../hooks/useFavorites', () => ({ useFavorites: () => ({ data: [] }) }))
afterEach(cleanup)
it('supports direct favorite links and meal chips, and resets every active filter', () => {
  render(<MemoryRouter initialEntries={['/app/recipes?favorites=true']}><RecipesPage /></MemoryRouter>)
  const favorites = screen.getByRole('button', { name: /Favoritas/ })
  expect(favorites.getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'Almoço' }))
  expect(screen.getByRole('button', { name: 'Almoço' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getAllByRole('button', { name: /Limpar filtros/ })[0])
  expect(screen.getByRole('button', { name: 'Todas' }).getAttribute('aria-pressed')).toBe('true')
  expect(favorites.getAttribute('aria-pressed')).toBe('false')
})
