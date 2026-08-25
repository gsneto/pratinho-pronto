import type { Ingredient, MealPlanItem } from '../../types/domain'

export interface AggregatedShoppingItem {
  ingredient: Ingredient
  ingredient_id: string
  quantity: number
  unit: string
}

export function aggregateShoppingList(
  mealPlanItems: MealPlanItem[],
): AggregatedShoppingItem[] {
  const grouped = new Map<string, AggregatedShoppingItem>()

  mealPlanItems.forEach((planItem) => {
    planItem.recipe.recipe_ingredients
      .filter((item) => !item.is_optional)
      .forEach((item) => {
        const key = `${item.ingredient_id}:${item.unit.trim().toLocaleLowerCase('pt-BR')}`
        const current = grouped.get(key)
        grouped.set(key, {
          ingredient: item.ingredient,
          ingredient_id: item.ingredient_id,
          quantity: (current?.quantity ?? 0) + Number(item.quantity),
          unit: item.unit,
        })
      })
  })

  return [...grouped.values()].sort(
    (a, b) =>
      a.ingredient.category.localeCompare(b.ingredient.category) ||
      a.ingredient.name.localeCompare(b.ingredient.name, 'pt-BR'),
  )
}
