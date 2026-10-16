import type { Ingredient, MealType, Recipe } from '../types/domain'
import { normalizeReviewStatus, type RecipeReviewStatus } from '../lib/recipes/review'
import { normalizeTerm } from '../utils/text'
import { getSupabaseClient } from './supabase/client'

export const recipeFields = `
  id,name,description,min_age_months,meal_type,prep_time_minutes,instructions,
  serving_notes,storage_notes,substitutions,image_url,is_active,is_demo,
  recipe_ingredients(
    id,ingredient_id,quantity,unit,is_optional,
    ingredient:ingredients(id,name,category,created_at)
  ),
  recipe_allergens(id,allergen)
`

export async function listRecipes(): Promise<Recipe[]> {
  const { data, error } = await getSupabaseClient()
    .from('recipes')
    .select(recipeFields)
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return (data ?? []) as unknown as Recipe[]
}

export async function getRecipe(recipeId: string): Promise<Recipe> {
  const { data, error } = await getSupabaseClient()
    .from('recipes')
    .select(recipeFields)
    .eq('id', recipeId)
    .eq('is_active', true)
    .single()

  if (error) throw error
  return data as unknown as Recipe
}

/**
 * Status de revisão editorial do catálogo, quando a coluna existir.
 *
 * Lê `content_review_status` numa consulta separada, tolerante à ausência da
 * coluna: se o schema remoto ainda não tem a migração, devolve `null` e o
 * aplicativo segue sem indicador — nunca inventa um estado. Receitas com valor
 * desconhecido ficam fora do mapa (aparecem como "sem informação").
 */
export async function listRecipeReviewStatuses(): Promise<Record<string, RecipeReviewStatus> | null> {
  const { data, error } = await getSupabaseClient()
    .from('recipes')
    .select('id,content_review_status')

  if (error) return null

  const statuses: Record<string, RecipeReviewStatus> = {}
  for (const row of (data ?? []) as Array<{ id: string; content_review_status?: unknown }>) {
    const status = normalizeReviewStatus(row.content_review_status)
    if (status) statuses[row.id] = status
  }
  return statuses
}

export async function listIngredients(): Promise<Ingredient[]> {
  const { data, error } = await getSupabaseClient()
    .from('ingredients')
    .select('id,name,category,created_at')
    .order('name')

  if (error) throw error
  return (data ?? []) as Ingredient[]
}

export interface RecipeFilters {
  mealType?: MealType
  maxTime?: number
  maxMinAge?: number
  search?: string
}

export function filterRecipes(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
  // Busca sem depender de acento: "maca" encontra "Maçã", como na despensa.
  const search = normalizeTerm(filters.search ?? '')

  return recipes.filter((recipe) => {
    if (filters.mealType && recipe.meal_type !== filters.mealType) return false
    if (filters.maxTime && recipe.prep_time_minutes > filters.maxTime) return false
    if (filters.maxMinAge !== undefined && recipe.min_age_months > filters.maxMinAge) {
      return false
    }
    if (search && !normalizeTerm(`${recipe.name} ${recipe.description}`).includes(search)) {
      return false
    }
    return true
  })
}
