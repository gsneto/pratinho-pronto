import type { GeneratedMealPlanItem, MealPlan, MealType } from '../types/domain'
import { shiftIsoDate } from '../utils/dates'
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

export async function listMealPlanHistory(babyId: string): Promise<Array<{ id: string; week_start: string; created_at: string }>> {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await getSupabaseClient()
    .from('meal_plans')
    .select('id,week_start,created_at')
    .eq('user_id', userId)
    .eq('baby_id', babyId)
    .order('week_start', { ascending: false })
    .limit(12)

  if (error) throw error
  return (data ?? []) as Array<{ id: string; week_start: string; created_at: string }>
}

export async function addRecipeToMealPlan({
  babyId,
  date,
  mealType,
  recipeId,
  replaceExisting,
  weekStart,
}: {
  babyId: string
  date: string
  mealType: MealType
  recipeId: string
  replaceExisting: boolean
  weekStart: string
}): Promise<string> {
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

  if (replaceExisting) {
    const { error } = await client
      .from('meal_plan_items')
      .delete()
      .eq('meal_plan_id', plan.id)
      .eq('date', date)
      .eq('meal_type', mealType)
    if (error) throw error
  }

  let position = 0
  if (!replaceExisting) {
    const { data: existing, error } = await client
      .from('meal_plan_items')
      .select('position')
      .eq('meal_plan_id', plan.id)
      .eq('date', date)
      .eq('meal_type', mealType)
      .order('position', { ascending: false })
      .limit(1)
    if (error) throw error
    position = existing?.[0] ? Number(existing[0].position) + 1 : 0
  }

  const { error: itemError } = await client.from('meal_plan_items').insert({
    date,
    meal_plan_id: plan.id,
    meal_type: mealType,
    position,
    recipe_id: recipeId,
  })
  if (itemError) throw itemError
  return plan.id as string
}

export async function duplicateMealPlan(
  babyId: string,
  sourceWeekStart: string,
  targetWeekStart: string,
): Promise<string> {
  const source = await getMealPlan(babyId, sourceWeekStart)
  if (!source) throw new Error('Semana de origem não encontrada')
  const items = source.meal_plan_items.map((item) => ({
    date: shiftIsoDate(item.date, sourceWeekStart, targetWeekStart),
    meal_type: item.meal_type,
    position: item.position,
    recipe_id: item.recipe_id,
    recipe: item.recipe,
  }))
  return saveMealPlan(babyId, targetWeekStart, items)
}
