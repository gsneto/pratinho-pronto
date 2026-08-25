import { describe, expect, it } from 'vitest'
import type { MealPlanItem } from '../../types/domain'
import { aggregateShoppingList } from './aggregate'

function planItem(quantity: number, unit: string): MealPlanItem {
  return {
    recipe: {
      recipe_ingredients: [
        {
          ingredient_id: 'banana',
          is_optional: false,
          quantity,
          unit,
          ingredient: { id: 'banana', name: 'Banana', category: 'fruit' },
        },
      ],
    },
  } as unknown as MealPlanItem
}

describe('aggregateShoppingList', () => {
  it('deduplicates and sums matching units', () => {
    const result = aggregateShoppingList([
      planItem(1, 'unidade'),
      planItem(2, 'unidade'),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(3)
  })

  it('keeps incompatible units separate', () => {
    expect(
      aggregateShoppingList([planItem(1, 'unidade'), planItem(100, 'g')]),
    ).toHaveLength(2)
  })
})
