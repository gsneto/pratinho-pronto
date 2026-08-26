import { describe, expect, it } from 'vitest'
import type { Baby, Recipe } from '../../types/domain'
import { rankRecipesByPantry } from './ranking'

const baby = {
  birth_date: '2025-12-01',
  restrictions: [],
  known_allergens: [],
  avoided_foods: [],
} as unknown as Baby

function recipe(id: string, ingredientIds: string[]): Recipe {
  return {
    id,
    is_active: true,
    meal_type: 'snack',
    min_age_months: 6,
    name: id,
    prep_time_minutes: 10,
    recipe_allergens: [],
    recipe_ingredients: ingredientIds.map((ingredientId) => ({
      ingredient_id: ingredientId,
      is_optional: false,
      ingredient: { id: ingredientId, name: ingredientId },
    })),
  } as unknown as Recipe
}

describe('rankRecipesByPantry', () => {
  it('ranks by the proportion of required ingredients found', () => {
    const ranked = rankRecipesByPantry({
      baby,
      recipes: [recipe('half', ['banana', 'aveia']), recipe('complete', ['banana'])],
      referenceDate: new Date(2026, 7, 25),
      selectedIngredientIds: ['banana'],
    })
    expect(ranked.map((item) => [item.recipe.id, item.score])).toEqual([
      ['complete', 1],
      ['half', 0.5],
    ])
    expect(ranked[0]).toMatchObject({ canMakeNow: true, missingIngredientNames: [] })
    expect(ranked[1]).toMatchObject({
      canMakeNow: false,
      missingIngredientNames: ['aveia'],
    })
  })
})
