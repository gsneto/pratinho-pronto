import type { MealPlanItem, MealType } from '../../types/domain'

/**
 * Refeições de um dia e tipo para a célula do cardápio impresso.
 *
 * Retorna TODAS as refeições do tipo (inclusive "opções extras" adicionadas ao
 * mesmo dia/horário). Antes, o PDF usava `find`, exibindo apenas a primeira e
 * descartando silenciosamente as demais — diferente do que a tela mostra.
 */
export function mealCellItems(
  items: MealPlanItem[],
  date: string,
  mealType: MealType,
): MealPlanItem[] {
  return items.filter((item) => item.date === date && item.meal_type === mealType)
}
