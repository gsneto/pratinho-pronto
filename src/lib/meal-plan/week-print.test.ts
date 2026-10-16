import { describe, expect, it } from 'vitest'
import type { MealPlanItem } from '../../types/domain'
import { mealCellItems } from './week-print'

function item(id: string, date: string, mealType: MealPlanItem['meal_type'], name: string, position = 0): MealPlanItem {
  return { id, date, meal_type: mealType, position, recipe: { name } } as unknown as MealPlanItem
}

describe('mealCellItems', () => {
  it('retorna todas as refeições do tipo no dia, incluindo opções extras', () => {
    const items = [
      item('1', '2026-09-14', 'breakfast', 'Mingau'),
      item('2', '2026-09-14', 'breakfast', 'Omelete'),
      item('3', '2026-09-14', 'lunch', 'Frango'),
      item('4', '2026-09-15', 'breakfast', 'Cuscuz'),
    ]
    const cell = mealCellItems(items, '2026-09-14', 'breakfast')
    expect(cell.map((i) => i.recipe.name)).toEqual(['Mingau', 'Omelete'])
  })

  it('não mistura dias nem tipos', () => {
    const items = [item('1', '2026-09-14', 'lunch', 'Frango')]
    expect(mealCellItems(items, '2026-09-14', 'dinner')).toEqual([])
    expect(mealCellItems(items, '2026-09-15', 'lunch')).toEqual([])
  })

  it('reflete a ordem por posição definida na tela', () => {
    const items = [
      item('2', '2026-09-14', 'breakfast', 'Omelete', 1),
      item('1', '2026-09-14', 'breakfast', 'Mingau', 0),
    ]
    const cell = mealCellItems(items, '2026-09-14', 'breakfast')
    expect(cell.map((entry) => entry.recipe.name)).toEqual(['Mingau', 'Omelete'])
  })
})
