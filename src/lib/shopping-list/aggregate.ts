import type { Ingredient, MealPlanItem } from '../../types/domain'
import { consolidateQuantities, type UnitQuantity } from './consolidate'

export interface AggregatedShoppingItem {
  ingredient: Ingredient
  ingredient_id: string
  quantity: number
  unit: string
}

interface IngredientEntries {
  ingredient: Ingredient
  entries: UnitQuantity[]
}

/**
 * Consolida os ingredientes de todas as refeições do cardápio em uma lista de
 * compras.
 *
 * Agrupa por ingrediente e, dentro dele, por unidade compatível (ver
 * `consolidateQuantities`): variantes de digitação se juntam ("un" ≡ "unidade")
 * e unidades convertíveis são somadas (1 l + 500 ml = 1,5 l). Unidades
 * incompatíveis continuam em linhas separadas. Ingredientes opcionais ficam de
 * fora.
 */
export function aggregateShoppingList(
  mealPlanItems: MealPlanItem[],
): AggregatedShoppingItem[] {
  const byIngredient = new Map<string, IngredientEntries>()

  for (const planItem of mealPlanItems) {
    for (const item of planItem.recipe.recipe_ingredients) {
      if (item.is_optional) continue
      const quantity = Number(item.quantity)
      if (!Number.isFinite(quantity)) continue

      const current = byIngredient.get(item.ingredient_id)
      if (current) {
        current.entries.push({ quantity, unit: item.unit })
      } else {
        byIngredient.set(item.ingredient_id, {
          ingredient: item.ingredient,
          entries: [{ quantity, unit: item.unit }],
        })
      }
    }
  }

  const aggregated: AggregatedShoppingItem[] = []
  for (const [ingredient_id, group] of byIngredient) {
    for (const consolidated of consolidateQuantities(group.entries)) {
      aggregated.push({
        ingredient: group.ingredient,
        ingredient_id,
        quantity: consolidated.quantity,
        unit: consolidated.unit,
      })
    }
  }

  return aggregated.sort(
    (a, b) =>
      a.ingredient.category.localeCompare(b.ingredient.category) ||
      a.ingredient.name.localeCompare(b.ingredient.name, 'pt-BR'),
  )
}
