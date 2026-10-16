import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadCatalog } from './catalog.mjs'

it('loads the complete local demo catalog without inventing recipe instructions', () => {
  const { recipes, ingredients } = loadCatalog()
  const sources = readFileSync(new URL('../supabase/seed.sql', import.meta.url), 'utf8') +
    readFileSync(new URL('../supabase/migrations/20260826013000_expand_recipe_catalog.sql', import.meta.url), 'utf8')
  expect(recipes).toHaveLength(72)
  expect(ingredients).toHaveLength(36)
  expect(new Set(recipes.map((recipe) => recipe.id)).size).toBe(72)
  expect(new Set(recipes.map((recipe) => recipe.name)).size).toBe(72)
  for (const recipe of recipes) {
    expect(sources).toContain(recipe.instructions.replaceAll("'", "''"))
    expect(recipe.recipe_ingredients.length).toBeGreaterThanOrEqual(2)
    expect(recipe.is_demo).toBe(true)
    for (const item of recipe.recipe_ingredients) {
      expect(ingredients.some((ingredient) => ingredient.id === item.ingredient_id)).toBe(true)
      expect(item.quantity).toBeGreaterThan(0)
    }
  }
  expect(recipes.find((recipe) => recipe.name === 'Mamão com aveia macia')?.storage_notes).toBe('Não recomendado para congelamento.')
  expect(recipes.find((recipe) => recipe.name === 'Cuscuz macio com ovo')?.recipe_allergens.map((item) => item.allergen)).toEqual(['ovo'])
})
