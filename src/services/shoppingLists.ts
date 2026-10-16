import type { MealPlan, ShoppingList, ShoppingListItem } from '../types/domain'
import { aggregateShoppingList } from '../lib/shopping-list/aggregate'
import { mergeShoppingListItems } from '../lib/shopping-list/merge'
import { normalizeTerm } from '../utils/text'
import { getAuthenticatedUserId } from './supabase/auth-user'
import { getSupabaseClient } from './supabase/client'

type Client = ReturnType<typeof getSupabaseClient>

const itemFields = (extra = '') => `
  id,shopping_list_id,ingredient_id${extra},quantity,unit,checked,
  ingredient:ingredients(id,name,category,created_at)
`

// Formato base: só o que existe no schema atual. `custom_name` é opcional
// (item livre) e só aparece quando a coluna existe — ver getShoppingList.
const shoppingListBaseFields = `id,user_id,meal_plan_id,created_at, shopping_list_items(${itemFields()})`
const shoppingListManualFields = `id,user_id,meal_plan_id,created_at, shopping_list_items(${itemFields(',custom_name')})`

function normalizeShoppingList(data: unknown): ShoppingList | null {
  if (!data || typeof data !== 'object') return null
  const list = data as ShoppingList
  return {
    ...list,
    shopping_list_items: (list.shopping_list_items ?? []).map((item) => ({
      ...item,
      custom_name: item.custom_name ?? null,
      ingredient: item.ingredient ?? null,
    })),
  }
}

async function readShoppingList(
  client: Client,
  userId: string,
  mealPlanId: string,
  fields: string,
): Promise<{ data: unknown; error: unknown }> {
  const { data, error } = await client
    .from('shopping_lists')
    .select(fields)
    .eq('user_id', userId)
    .eq('meal_plan_id', mealPlanId)
    .maybeSingle()
  return { data, error }
}

export async function getShoppingList(
  mealPlanId: string,
): Promise<ShoppingList | null> {
  const userId = await getAuthenticatedUserId()
  const client = getSupabaseClient()

  // Lê primeiro o formato com o rótulo de item livre. Se a coluna opcional não
  // existir no schema (produção sem a migração), cai para o formato base — o
  // aplicativo continua funcionando, apenas sem itens livres.
  const manual = await readShoppingList(client, userId, mealPlanId, shoppingListManualFields)
  if (!manual.error) return normalizeShoppingList(manual.data)

  const base = await readShoppingList(client, userId, mealPlanId, shoppingListBaseFields)
  if (base.error) throw base.error
  return normalizeShoppingList(base.data)
}

export async function generateShoppingList(plan: MealPlan): Promise<string> {
  await getAuthenticatedUserId()
  const items = aggregateShoppingList(plan.meal_plan_items).map((item) => ({
    ingredient_id: item.ingredient_id,
    quantity: item.quantity,
    unit: item.unit,
  }))

  // Uma única chamada atômica: substituir (delete + insert) em transação no
  // banco. Sem isso, uma falha entre as etapas deixaria a lista incompleta.
  const { data, error } = await getSupabaseClient().rpc('replace_shopping_list', {
    p_meal_plan_id: plan.id,
    p_items: items,
  })

  if (error) throw error
  return data as string
}

export async function setShoppingItemChecked(
  itemId: string,
  checked: boolean,
): Promise<void> {
  await getAuthenticatedUserId()
  const { error } = await getSupabaseClient()
    .from('shopping_list_items')
    .update({ checked })
    .eq('id', itemId)

  if (error) throw error
}

export async function appendShoppingListItems(
  mealPlanId: string,
  items: Array<{ ingredient_id: string; quantity: number; unit: string }>,
): Promise<string> {
  const userId = await getAuthenticatedUserId()
  const client = getSupabaseClient()
  const { data: list, error: listError } = await client
    .from('shopping_lists')
    .upsert({ meal_plan_id: mealPlanId, user_id: userId }, { onConflict: 'meal_plan_id' })
    .select('id')
    .single()
  if (listError) throw listError

  // Soma às quantidades já existentes em vez de sobrescrever: adicionar um
  // ingrediente faltante não pode reduzir o total calculado pelo cardápio.
  const { data: existing, error: readError } = await client
    .from('shopping_list_items')
    .select('ingredient_id,quantity,unit')
    .eq('shopping_list_id', list.id)
  if (readError) throw readError

  // Só itens do catálogo entram no merge/upsert. Itens manuais (ingredient_id
  // nulo) pertencem ao usuário e são preservados: reenviá-los aqui, sem
  // `custom_name`, violaria a restrição de origem do banco.
  const catalogItems = (existing ?? []).filter(
    (item): item is { ingredient_id: string; quantity: number; unit: string } =>
      item.ingredient_id !== null && item.ingredient_id !== undefined,
  )
  const merged = mergeShoppingListItems(catalogItems, items)

  const { error } = await client
    .from('shopping_list_items')
    .upsert(merged.map((item) => ({ ...item, shopping_list_id: list.id })), {
      onConflict: 'shopping_list_id,ingredient_id,unit',
      ignoreDuplicates: false,
    })
  if (error) throw error
  return list.id as string
}

interface StoredQuantityItem {
  id: string
  ingredient_id: string | null
  custom_name?: string | null
  quantity: number
  unit: string
}

function sameUnit(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase('pt-BR') === right.trim().toLocaleLowerCase('pt-BR')
}

async function readStoredItems(client: Client, listId: string): Promise<StoredQuantityItem[]> {
  // Lê com `custom_name` quando disponível; sem a coluna, usa o formato base.
  const withName = await client
    .from('shopping_list_items')
    .select('id,ingredient_id,custom_name,quantity,unit')
    .eq('shopping_list_id', listId)
  if (!withName.error) return (withName.data ?? []) as StoredQuantityItem[]

  const base = await client
    .from('shopping_list_items')
    .select('id,ingredient_id,quantity,unit')
    .eq('shopping_list_id', listId)
  if (base.error) throw base.error
  return (base.data ?? []) as StoredQuantityItem[]
}

export interface ManualShoppingItemInput {
  name: string
  quantity: number
  unit: string
  /** Ingrediente do catálogo correspondente; nulo para um item livre. */
  ingredientId: string | null
}

/**
 * Adiciona um item à lista, seja um ingrediente do catálogo ou um item livre.
 *
 * Evita duplicar: se já existir o mesmo ingrediente + unidade, soma a
 * quantidade; para itens livres, soma quando o nome normalizado + unidade
 * coincidem. Itens livres dependem da coluna `custom_name` — sem ela, o banco
 * recusa a gravação e o erro é propagado (nada é fingido como salvo).
 */
export async function addShoppingListItem(
  mealPlanId: string,
  input: ManualShoppingItemInput,
): Promise<string> {
  const userId = await getAuthenticatedUserId()
  const client = getSupabaseClient()
  const { data: list, error: listError } = await client
    .from('shopping_lists')
    .upsert({ meal_plan_id: mealPlanId, user_id: userId }, { onConflict: 'meal_plan_id' })
    .select('id')
    .single()
  if (listError) throw listError

  const name = input.name.trim()
  const unit = input.unit.trim()
  const existing = await readStoredItems(client, list.id)
  const match = existing.find((item) =>
    input.ingredientId
      ? item.ingredient_id === input.ingredientId && sameUnit(item.unit, unit)
      : !item.ingredient_id &&
        sameUnit(item.unit, unit) &&
        normalizeTerm(item.custom_name ?? '') === normalizeTerm(name),
  )

  if (match) {
    const { error } = await client
      .from('shopping_list_items')
      .update({ quantity: Number(match.quantity) + Number(input.quantity) })
      .eq('id', match.id)
    if (error) throw error
  } else {
    const payload: Record<string, unknown> = {
      shopping_list_id: list.id,
      ingredient_id: input.ingredientId,
      quantity: input.quantity,
      unit,
      checked: false,
    }
    // `custom_name` só é enviado para item manual. Em item do catálogo o campo
    // fica nulo por padrão — assim a inclusão funciona também em um schema que
    // ainda não recebeu a migração de itens manuais.
    if (!input.ingredientId) payload.custom_name = name

    const { error } = await client.from('shopping_list_items').insert(payload)
    if (error) throw error
  }

  return list.id as string
}

export interface ShoppingListItemPatch {
  quantity: number
  unit: string
  /** Só para itens livres: reescreve o rótulo. */
  name?: string
}

export async function updateShoppingListItem(
  itemId: string,
  patch: ShoppingListItemPatch,
): Promise<void> {
  await getAuthenticatedUserId()
  const update: Record<string, unknown> = {
    quantity: patch.quantity,
    unit: patch.unit.trim(),
  }
  if (patch.name !== undefined) update.custom_name = patch.name.trim()

  const { error } = await getSupabaseClient()
    .from('shopping_list_items')
    .update(update)
    .eq('id', itemId)
  if (error) throw error
}

export async function removeShoppingListItem(itemId: string): Promise<void> {
  await getAuthenticatedUserId()
  const { error } = await getSupabaseClient()
    .from('shopping_list_items')
    .delete()
    .eq('id', itemId)
  if (error) throw error
}

export type { ShoppingListItem }
