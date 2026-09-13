import { describe, expect, it } from 'vitest'
import type { IngredientCategory, MealType } from '../types/domain'
import {
  compareIngredientCategories,
  compareMealTypes,
  ingredientCategoryLabels,
  mealTypeLabels,
} from './labels'

describe('compareMealTypes', () => {
  it('ordena as refeições na sequência do dia, não em ordem alfabética', () => {
    const shuffled: MealType[] = ['dinner', 'snack', 'breakfast', 'lunch']
    expect(shuffled.slice().sort(compareMealTypes)).toEqual([
      'breakfast',
      'lunch',
      'snack',
      'dinner',
    ])
  })

  it('mantém um rótulo em português para cada refeição', () => {
    expect(Object.keys(mealTypeLabels)).toHaveLength(4)
    expect(mealTypeLabels.breakfast).toBe('Café da manhã')
  })
})

describe('compareIngredientCategories', () => {
  it('agrupa a lista na ordem do percurso no mercado', () => {
    const shuffled: IngredientCategory[] = [
      'seasoning',
      'grain',
      'protein',
      'fruit',
      'other',
      'dairy',
      'vegetable',
    ]
    expect(shuffled.slice().sort(compareIngredientCategories)).toEqual([
      'fruit',
      'vegetable',
      'protein',
      'dairy',
      'grain',
      'seasoning',
      'other',
    ])
  })

  it('cobre todas as categorias existentes no domínio', () => {
    const categories = Object.keys(ingredientCategoryLabels) as IngredientCategory[]
    for (const category of categories) {
      expect(compareIngredientCategories(category, category)).toBe(0)
    }
  })
})
