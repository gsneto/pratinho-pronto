import { describe, expect, it } from 'vitest'
import type { Baby, MealType, Recipe } from '../../types/domain'
import { generateWeeklyMealPlan, isRecipeCompatible } from './generator'

const baby = {
  birth_date: '2026-01-01',
  restrictions: [],
  known_allergens: [],
  avoided_foods: [],
} as unknown as Baby

function recipe(
  id: string,
  mealType: MealType,
  minAge = 6,
  allergen?: string,
): Recipe {
  return {
    id,
    is_active: true,
    meal_type: mealType,
    min_age_months: minAge,
    name: `Receita ${id}`,
    recipe_allergens: allergen ? [{ id: `a-${id}`, allergen }] : [],
    recipe_ingredients: [
      {
        id: `ri-${id}`,
        ingredient_id: `i-${id}`,
        ingredient: { id: `i-${id}`, name: `Ingrediente ${id}` },
      },
    ],
  } as unknown as Recipe
}

describe('weekly meal plan generator', () => {
  it('respects minimum age', () => {
    expect(
      isRecipeCompatible(baby, recipe('older', 'breakfast', 12), new Date(2026, 7, 24)),
    ).toBe(false)
  })

  it('respects known allergens and restrictions', () => {
    const babyWithEggRestriction = {
      ...baby,
      known_allergens: ['ovo'],
    }
    expect(
      isRecipeCompatible(
        babyWithEggRestriction,
        recipe('egg', 'breakfast', 6, 'ovo'),
        new Date(2026, 7, 24),
      ),
    ).toBe(false)
  })

  it('generates only the requested meal type', () => {
    const result = generateWeeklyMealPlan({
      baby,
      recipes: [recipe('breakfast', 'breakfast'), recipe('lunch', 'lunch')],
      selectedMealTypes: ['breakfast'],
      weekStart: '2026-08-24',
    })
    expect(result).toHaveLength(7)
    expect(result.every((item) => item.meal_type === 'breakfast')).toBe(true)
  })

  it('distributes recipes instead of repeating one excessively', () => {
    const result = generateWeeklyMealPlan({
      baby,
      recipes: [
        recipe('one', 'breakfast'),
        recipe('two', 'breakfast'),
        recipe('three', 'breakfast'),
      ],
      selectedMealTypes: ['breakfast'],
      weekStart: '2026-08-24',
    })
    const usage = result.reduce<Record<string, number>>((counts, item) => {
      counts[item.recipe_id] = (counts[item.recipe_id] ?? 0) + 1
      return counts
    }, {})
    const values = Object.values(usage)
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1)
  })

  it('vegetariano exclui receitas com carne, mas mantém opções sem carne', () => {
    const vegetarian = { ...baby, restrictions: ['vegetariano'] } as Baby
    const reference = new Date(2026, 7, 24)
    const withMeat = {
      ...recipe('meat', 'lunch'),
      recipe_ingredients: [
        { id: 'ri', ingredient_id: 'i', ingredient: { id: 'i', name: 'Carne bovina' } },
      ],
    } as unknown as Recipe
    const plantBased = {
      ...recipe('plant', 'lunch'),
      recipe_ingredients: [
        { id: 'ri', ingredient_id: 'i', ingredient: { id: 'i', name: 'Lentilha' } },
      ],
    } as unknown as Recipe

    expect(isRecipeCompatible(vegetarian, withMeat, reference)).toBe(false)
    expect(isRecipeCompatible(vegetarian, plantBased, reference)).toBe(true)
  })

  it('geração com restrição vegetariana não inclui receitas com carne', () => {
    const vegetarian = { ...baby, restrictions: ['vegetariano'] } as Baby
    const withMeat = {
      ...recipe('meat', 'lunch'),
      recipe_ingredients: [
        { id: 'ri', ingredient_id: 'i', ingredient: { id: 'i', name: 'Frango' } },
      ],
    } as unknown as Recipe
    const plantBased = {
      ...recipe('plant', 'lunch'),
      recipe_ingredients: [
        { id: 'ri', ingredient_id: 'i', ingredient: { id: 'i', name: 'Lentilha' } },
      ],
    } as unknown as Recipe

    const result = generateWeeklyMealPlan({
      baby: vegetarian,
      recipes: [withMeat, plantBased],
      selectedMealTypes: ['lunch'],
      weekStart: '2026-08-24',
    })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((item) => item.recipe_id === 'plant')).toBe(true)
  })
})
