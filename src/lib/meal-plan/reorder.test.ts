import { describe, expect, it } from 'vitest'
import type { MealPlanItem } from '../../types/domain'
import { canMoveMealItem, mealItemNeighbour, sortDayItems } from './reorder'

function item(id: string, mealType: MealPlanItem['meal_type'], position: number): MealPlanItem {
  return {
    id,
    meal_plan_id: 'plan-1',
    recipe_id: `recipe-${id}`,
    date: '2026-09-14',
    meal_type: mealType,
    position,
    recipe: { id: `recipe-${id}`, name: `Receita ${id}` },
  } as unknown as MealPlanItem
}

describe('sortDayItems', () => {
  it('ordena por tipo de refeição e, dentro do tipo, pela posição', () => {
    const sorted = sortDayItems([
      item('lunch', 'lunch', 0),
      item('breakfast-1', 'breakfast', 1),
      item('breakfast-0', 'breakfast', 0),
      item('dinner', 'dinner', 0),
    ])
    expect(sorted.map((entry) => entry.id)).toEqual(['breakfast-0', 'breakfast-1', 'lunch', 'dinner'])
  })
})

describe('canMoveMealItem', () => {
  const day = [
    item('b0', 'breakfast', 0),
    item('b1', 'breakfast', 1),
    item('lunch', 'lunch', 0),
  ]

  it('permite trocar dentro do mesmo tipo', () => {
    expect(canMoveMealItem(day, 'b0', 'down')).toBe(true)
    expect(canMoveMealItem(day, 'b1', 'up')).toBe(true)
  })

  it('não cruza tipos de refeição diferentes', () => {
    expect(canMoveMealItem(day, 'b1', 'down')).toBe(false)
    expect(canMoveMealItem(day, 'lunch', 'up')).toBe(false)
  })

  it('não move além dos limites', () => {
    expect(canMoveMealItem(day, 'b0', 'up')).toBe(false)
    expect(canMoveMealItem(day, 'lunch', 'down')).toBe(false)
    expect(canMoveMealItem(day, 'missing', 'up')).toBe(false)
  })
})

describe('mealItemNeighbour', () => {
  const day = [item('b0', 'breakfast', 0), item('b1', 'breakfast', 1), item('lunch', 'lunch', 0)]

  it('devolve o irmão do mesmo tipo na direção pedida', () => {
    expect(mealItemNeighbour(day, 'b0', 'down')?.id).toBe('b1')
    expect(mealItemNeighbour(day, 'b1', 'up')?.id).toBe('b0')
  })

  it('devolve null quando não há irmão do mesmo tipo', () => {
    expect(mealItemNeighbour(day, 'lunch', 'up')).toBeNull()
    expect(mealItemNeighbour(day, 'b1', 'down')).toBeNull()
  })
})
