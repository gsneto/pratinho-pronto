// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecipeCard } from './RecipeCard'
import type { Recipe } from '../../types/domain'
vi.mock('../../hooks/useFavorites', () => ({ useFavoriteRecipe: () => ({ isFavorite: false, isSaving: false, toggle: vi.fn() }) }))
afterEach(cleanup)
it('opens a recipe from its photograph and labels demonstration content honestly', () => {
  const recipe = { id: 'recipe-1', name: 'Mingau de banana e aveia', description: 'Creme de banana', min_age_months: 6, meal_type: 'breakfast', prep_time_minutes: 12, image_url: null, is_demo: true } as Recipe
  render(<MemoryRouter><RecipeCard recipe={recipe} returnTo="/app/recipes?q=banana" /></MemoryRouter>)
  expect(screen.getByRole('link', { name: `Ver receita: ${recipe.name}` }).getAttribute('href')).toBe('/app/recipes/recipe-1')
  expect(screen.getByText('Demonstrativa')).toBeTruthy()
  expect(screen.getByRole('button', { name: `Favoritar ${recipe.name}` })).toBeTruthy()
})
