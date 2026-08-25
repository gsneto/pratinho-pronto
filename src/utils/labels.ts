import type { IngredientCategory, MealType } from '../types/domain'

export const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Café da manhã',
  dinner: 'Jantar',
  lunch: 'Almoço',
  snack: 'Lanche',
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

export const weekDayLabels = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
