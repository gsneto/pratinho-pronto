import type { GeneratedMealPlanItem, MealPlan } from '../types/domain'
import { recipeFields } from './recipes'
import { getAuthenticatedUserId } from './supabase/auth-user'
import { getSupabaseClient } from './supabase/client'

const mealPlanFields = `
  id,user_id,baby_id,week_start,created_at,updated_at,
  meal_plan_items(
    id,meal_plan_id,recipe_id,date,meal_type,position,
    recipe:recipes(${recipeFields})
  )
`

export async function getMealPlan(
  babyId: string,
  weekStart: string,
): Promise<MealPlan | null> {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await getSupabaseClient()
    .from('meal_plans')
    .select(mealPlanFields)
    .eq('user_id', userId)
    .eq('baby_id', babyId)
    .eq('week_start', weekStart)
    .maybeSingle()

  if (error) throw error
  return data as unknown as MealPlan | null
}

export async function saveMealPlan(
  babyId: string,
  weekStart: string,
  items: GeneratedMealPlanItem[],
): Promise<string> {
  const userId = await getAuthenticatedUserId()
  const client = getSupabaseClient()
  const { data: plan, error: planError } = await client
    .from('meal_plans')
    .upsert(
      { baby_id: babyId, user_id: userId, week_start: weekStart },
      { onConflict: 'user_id,baby_id,week_start' },
    )
    .select('id')
    .single()

  if (planError) throw planError

  const { error: deleteError } = await client
    .from('meal_plan_items')
    .delete()
    .eq('meal_plan_id', plan.id)
  if (deleteError) throw deleteError

  const { error: itemsError } = await client.from('meal_plan_items').insert(
    items.map((item) => ({
      date: item.date,
      meal_plan_id: plan.id,
      meal_type: item.meal_type,
      position: item.position,
      recipe_id: item.recipe_id,
    })),
  )
  if (itemsError) throw itemsError

  return plan.id as string
}

export async function replaceMealPlanItem(
  itemId: string,
  recipeId: string,
): Promise<void> {
  await getAuthenticatedUserId()
  const { error } = await getSupabaseClient()
    .from('meal_plan_items')
    .update({ recipe_id: recipeId })
    .eq('id', itemId)

  if (error) throw error
}
