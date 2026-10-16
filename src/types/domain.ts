export type IngredientCategory =
  | 'fruit'
  | 'vegetable'
  | 'protein'
  | 'grain'
  | 'dairy'
  | 'seasoning'
  | 'other'

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export interface Baby {
  id: string
  user_id: string
  name: string
  birth_date: string
  restrictions: string[]
  known_allergens: string[]
  avoided_foods: string[]
  notes: string | null
  photo_path: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface BabyInput {
  name: string
  birth_date: string
  restrictions: string[]
  known_allergens: string[]
  avoided_foods: string[]
  notes?: string | null
}

export interface Ingredient {
  id: string
  name: string
  category: IngredientCategory
  created_at: string
}

export interface RecipeIngredient {
  id: string
  ingredient_id: string
  quantity: number
  unit: string
  is_optional: boolean
  ingredient: Ingredient
}

export interface RecipeAllergen {
  id: string
  allergen: string
}

export interface Recipe {
  id: string
  name: string
  description: string
  min_age_months: number
  meal_type: MealType
  prep_time_minutes: number
  instructions: string
  serving_notes: string | null
  storage_notes: string | null
  substitutions: string | null
  image_url: string | null
  is_active: boolean
  is_demo: boolean
  /**
   * Status de revisão profissional do conteúdo editorial. Opcional: a coluna
   * pode não existir no schema atual (migração pendente) e o catálogo funciona
   * sem ela. Nunca é usada como prova de validação clínica.
   */
  content_review_status?: string | null
  recipe_ingredients: RecipeIngredient[]
  recipe_allergens: RecipeAllergen[]
}

export interface MealPlanItem {
  id: string
  meal_plan_id: string
  recipe_id: string
  date: string
  meal_type: MealType
  position: number
  recipe: Recipe
}

export interface MealPlan {
  id: string
  user_id: string
  baby_id: string
  week_start: string
  created_at: string
  updated_at: string
  meal_plan_items: MealPlanItem[]
}

export interface GeneratedMealPlanItem {
  date: string
  meal_type: MealType
  position: number
  recipe_id: string
  recipe: Recipe
}

export interface ShoppingListItem {
  id: string
  shopping_list_id: string
  /**
   * Ingrediente do catálogo. Nulo em itens livres ("adicionar item pelo nome"
   * sem correspondência no catálogo), que usam `custom_name`.
   */
  ingredient_id: string | null
  /** Rótulo de um item livre. Nulo em itens derivados do catálogo/cardápio. */
  custom_name: string | null
  quantity: number
  unit: string
  checked: boolean
  ingredient: Ingredient | null
}

export interface ShoppingList {
  id: string
  user_id: string
  meal_plan_id: string
  created_at: string
  shopping_list_items: ShoppingListItem[]
}
