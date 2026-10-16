import type { MealPlanItem } from '../../types/domain'
import { compareMealTypes } from '../../utils/labels'

export type MoveDirection = 'up' | 'down'

/**
 * Ordem em que o dia é exibido: primeiro pelo tipo de refeição (café, almoço,
 * lanche, jantar) e, dentro do mesmo tipo, pela `position`.
 */
export function sortDayItems(items: MealPlanItem[]): MealPlanItem[] {
  return items
    .slice()
    .sort((a, b) => compareMealTypes(a.meal_type, b.meal_type) || a.position - b.position)
}

/**
 * A `position` só tem significado entre refeições do MESMO tipo no mesmo dia
 * (é o que o índice único do banco expressa). Por isso a reordenação é sempre
 * dentro do próprio tipo — não cruzamos café com almoço, por exemplo.
 */
function neighbourIndex(items: MealPlanItem[], itemId: string, direction: MoveDirection): number {
  const ordered = sortDayItems(items)
  const index = ordered.findIndex((item) => item.id === itemId)
  if (index === -1) return -1
  const target = direction === 'up' ? index - 1 : index + 1
  if (!ordered[target] || ordered[target].meal_type !== ordered[index].meal_type) return -1
  return target
}

export function canMoveMealItem(
  items: MealPlanItem[],
  itemId: string,
  direction: MoveDirection,
): boolean {
  return neighbourIndex(items, itemId, direction) !== -1
}

/** Vizinho do mesmo tipo na direção pedida, ou null quando não há. */
export function mealItemNeighbour(
  items: MealPlanItem[],
  itemId: string,
  direction: MoveDirection,
): MealPlanItem | null {
  const ordered = sortDayItems(items)
  const target = neighbourIndex(items, itemId, direction)
  return target === -1 ? null : ordered[target]
}
