/**
 * Soma itens da lista de compras sem converter unidades.
 *
 * Ao adicionar ingredientes faltantes a partir da despensa, um item que já
 * existe na lista precisa ter a quantidade somada — nunca substituída. Sem
 * isso, adicionar um ingrediente reduziria silenciosamente o total calculado
 * pelo cardápio.
 */
export interface ShoppingListQuantityItem {
  ingredient_id: string
  quantity: number
  unit: string
}

function itemKey(item: ShoppingListQuantityItem): string {
  return `${item.ingredient_id}:${item.unit.trim().toLocaleLowerCase('pt-BR')}`
}

export function mergeShoppingListItems(
  existing: ShoppingListQuantityItem[],
  incoming: ShoppingListQuantityItem[],
): ShoppingListQuantityItem[] {
  const merged = new Map<string, ShoppingListQuantityItem>()

  for (const item of [...existing, ...incoming]) {
    const key = itemKey(item)
    const current = merged.get(key)
    merged.set(key, {
      ingredient_id: item.ingredient_id,
      quantity: (current?.quantity ?? 0) + Number(item.quantity),
      unit: current?.unit ?? item.unit,
    })
  }

  return [...merged.values()]
}
