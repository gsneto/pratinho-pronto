import type { IngredientCategory, MealType } from '../types/domain'

export const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Café da manhã',
  dinner: 'Jantar',
  lunch: 'Almoço',
  snack: 'Lanche',
}

/** Ordem em que as refeições acontecem no dia, usada para exibir o cardápio. */
export const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']

export function compareMealTypes(a: MealType, b: MealType): number {
  return mealTypeOrder.indexOf(a) - mealTypeOrder.indexOf(b)
}

export const ingredientCategoryLabels: Record<IngredientCategory, string> = {
  dairy: 'Laticínios',
  fruit: 'Frutas',
  grain: 'Grãos e cereais',
  other: 'Outros',
  protein: 'Proteínas',
  seasoning: 'Temperos',
  vegetable: 'Legumes e verduras',
}

/**
 * Ordem de percurso no mercado: hortifrúti primeiro, temperos por último.
 * Deixa a lista impressa na sequência em que a compra realmente acontece.
 */
export const ingredientCategoryOrder: IngredientCategory[] = [
  'fruit',
  'vegetable',
  'protein',
  'dairy',
  'grain',
  'seasoning',
  'other',
]

export function compareIngredientCategories(
  a: IngredientCategory,
  b: IngredientCategory,
): number {
  return ingredientCategoryOrder.indexOf(a) - ingredientCategoryOrder.indexOf(b)
}

export const weekDayLabels = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
