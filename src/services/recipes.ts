import type { Ingredient, MealType, Recipe } from '../types/domain'
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
  const search = filters.search?.trim().toLocaleLowerCase('pt-BR')

  return recipes.filter((recipe) => {
    if (filters.mealType && recipe.meal_type !== filters.mealType) return false
    if (filters.maxTime && recipe.prep_time_minutes > filters.maxTime) return false
    if (filters.maxMinAge !== undefined && recipe.min_age_months > filters.maxMinAge) {
      return false
    }
    if (search && !`${recipe.name} ${recipe.description}`.toLocaleLowerCase('pt-BR').includes(search)) {
      return false
    }
    return true
  })
}
