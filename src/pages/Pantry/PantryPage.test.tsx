// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { testBaby, testIngredient, testRecipe } from '../../test/fixtures'
import { PantryPage } from './PantryPage'

vi.mock('../../hooks/useBaby', () => ({ useBaby: () => ({ data: testBaby }) }))
vi.mock('../../hooks/useRecipes', () => ({ useIngredients: () => ({ data: [testIngredient, { ...testIngredient, id: 'abobora', name: 'Abóbora' }], isLoading: false }), useRecipes: () => ({ data: [testRecipe], isLoading: false }) }))
vi.mock('../../hooks/useMealPlan', () => ({ useMealPlan: () => ({ data: null }) }))
vi.mock('../../services/analytics', () => ({ analytics: { track: vi.fn() } }))
vi.mock('../../hooks/useFavorites', () => ({ useFavoriteRecipe: () => ({ isFavorite: false, isSaving: false, toggle: vi.fn() }) }))
afterEach(cleanup)

it('finds ingredients without accents and retains selections when the search changes', () => {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><PantryPage /></MemoryRouter></QueryClientProvider>)
  const search = screen.getByRole('searchbox', { name: 'Buscar ingredientes' })
  fireEvent.change(search, { target: { value: 'abobora' } })
  fireEvent.click(screen.getByRole('button', { name: 'Abóbora' }))
  fireEvent.change(search, { target: { value: 'banana' } })
  expect(screen.getByRole('button', { name: 'Remover Abóbora' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Banana' })).toBeTruthy()
  expect(screen.getByRole('status').textContent).toContain('1 ingrediente marcado')
  fireEvent.click(screen.getByRole('button', { name: 'Limpar tudo' }))
  expect((screen.getByRole('button', { name: 'Encontrar ideias' }) as HTMLButtonElement).disabled).toBe(true)
})
