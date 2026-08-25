import type { MealPlan, ShoppingList } from '../types/domain'
import { aggregateShoppingList } from '../lib/shopping-list/aggregate'
import { getAuthenticatedUserId } from './supabase/auth-user'
import { getSupabaseClient } from './supabase/client'

const shoppingListFields = `
  id,user_id,meal_plan_id,created_at,
  shopping_list_items(
    id,shopping_list_id,ingredient_id,quantity,unit,checked,
    ingredient:ingredients(id,name,category,created_at)
  )
`

export async function getShoppingList(
  mealPlanId: string,
): Promise<ShoppingList | null> {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await getSupabaseClient()
    .from('shopping_lists')
    .select(shoppingListFields)
    .eq('user_id', userId)
    .eq('meal_plan_id', mealPlanId)
    .maybeSingle()

  if (error) throw error
  return data as unknown as ShoppingList | null
}

export async function generateShoppingList(plan: MealPlan): Promise<string> {
  const userId = await getAuthenticatedUserId()
  const items = aggregateShoppingList(plan.meal_plan_items)
  const client = getSupabaseClient()
  const { data: list, error: listError } = await client
    .from('shopping_lists')
    .upsert(
      { meal_plan_id: plan.id, user_id: userId },
      { onConflict: 'meal_plan_id' },
    )
    .select('id')
    .single()

  if (listError) throw listError

  const { error: deleteError } = await client
    .from('shopping_list_items')
    .delete()
    .eq('shopping_list_id', list.id)
  if (deleteError) throw deleteError

  const { error: itemsError } = await client.from('shopping_list_items').insert(
    items.map((item) => ({
      checked: false,
      ingredient_id: item.ingredient_id,
      quantity: item.quantity,
      shopping_list_id: list.id,
      unit: item.unit,
    })),
  )
  if (itemsError) throw itemsError

  return list.id as string
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
