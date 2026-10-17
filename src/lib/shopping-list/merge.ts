import { consolidateQuantities, type UnitQuantity } from './consolidate'

/**
 * Soma itens da lista de compras resolvendo aliases de unidade e convertendo
 * unidades compatíveis.
 *
 * Ao adicionar ingredientes faltantes a partir da despensa, um item que já
 * existe na lista precisa ter a quantidade somada - nunca substituída. Sem
 * isso, adicionar um ingrediente reduziria silenciosamente o total calculado
 * pelo cardápio.
 *
 * A unidade exibida é a da primeira ocorrência (os itens existentes vêm antes
 * dos novos), preservada como está: o resultado alimenta um upsert que casa
 * pela coluna `unit`, e trocá-la pela forma canônica criaria uma linha órfã.
 */
export interface ShoppingListQuantityItem {
  ingredient_id: string
  quantity: number
  unit: string
}

export function mergeShoppingListItems(
  existing: ShoppingListQuantityItem[],
  incoming: ShoppingListQuantityItem[],
): ShoppingListQuantityItem[] {
  const byIngredient = new Map<string, UnitQuantity[]>()
  const order: string[] = []

  for (const item of [...existing, ...incoming]) {
    const entries = byIngredient.get(item.ingredient_id)
    if (entries) {
      entries.push({ quantity: item.quantity, unit: item.unit })
    } else {
      byIngredient.set(item.ingredient_id, [{ quantity: item.quantity, unit: item.unit }])
      order.push(item.ingredient_id)
    }
  }

  const merged: ShoppingListQuantityItem[] = []
  for (const ingredient_id of order) {
    const consolidated = consolidateQuantities(byIngredient.get(ingredient_id)!, {
      preserveDisplayUnit: true,
    })
    for (const item of consolidated) {
      merged.push({ ingredient_id, quantity: item.quantity, unit: item.unit })
    }
  }

  return merged
}
