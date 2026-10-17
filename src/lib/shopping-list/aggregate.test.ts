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

  it('junta variantes de digitação da mesma unidade (un ≡ unidade)', () => {
    const result = aggregateShoppingList([
      planItem(1, 'un'),
      planItem(2, 'unidade'),
      planItem(1, 'unidades'),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(4)
    expect(result[0].unit).toBe('unidade')
  })

  it('soma unidades convertíveis (1 l + 500 ml = 1,5 l)', () => {
    const result = aggregateShoppingList([planItem(1, 'l'), planItem(500, 'ml')])
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(1.5)
    expect(result[0].unit).toBe('l')
  })

  it('não funde unidades de contagem distintas (fatia ≠ unidade)', () => {
    expect(
      aggregateShoppingList([planItem(1, 'unidade'), planItem(1, 'fatia')]),
    ).toHaveLength(2)
  })

  it('ignora ingredientes opcionais', () => {
    const optional = {
      recipe: {
        recipe_ingredients: [
          {
            ingredient_id: 'banana',
            is_optional: true,
            quantity: 1,
            unit: 'unidade',
            ingredient: { id: 'banana', name: 'Banana', category: 'fruit' },
          },
        ],
      },
    } as unknown as MealPlanItem
    expect(aggregateShoppingList([optional])).toHaveLength(0)
  })
})
