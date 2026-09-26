import type { Baby, Ingredient, MealPlan, Recipe, ShoppingList } from '../types/domain'

// Fictitious records for automated tests. They never reach the production API.
export const testBaby: Baby = {
  id: 'test-baby', user_id: 'test-user', name: 'Alice', birth_date: '2025-09-01',
  restrictions: [], known_allergens: [], avoided_foods: [], notes: null,
  photo_path: null, photo_url: null, created_at: '2026-09-01', updated_at: '2026-09-01',
}
export const testIngredient: Ingredient = {
  id: 'test-banana', name: 'Banana', category: 'fruit', created_at: '2026-09-01',
}
export const testRecipe: Recipe = {
  id: 'test-recipe', name: 'Mingau de banana e aveia', description: 'Receita de teste.',
  min_age_months: 6, meal_type: 'breakfast', prep_time_minutes: 12,
  instructions: '1. Separe os ingredientes.\n2. Siga o preparo cadastrado.',
  serving_notes: 'Siga a orientação individual para servir.',
  storage_notes: 'Não congelar esta preparação.', substitutions: null,
  image_url: null, is_active: true, is_demo: true,
  recipe_ingredients: [{ id: 'test-recipe-ingredient', ingredient_id: testIngredient.id,
    quantity: 1, unit: 'unidade', is_optional: false, ingredient: testIngredient }],
  recipe_allergens: [],
}
export const testPlan: MealPlan = {
  id: 'test-plan', user_id: testBaby.user_id, baby_id: testBaby.id,
  week_start: '2026-09-14', created_at: '2026-09-14', updated_at: '2026-09-14',
  meal_plan_items: [{ id: 'test-meal', meal_plan_id: 'test-plan', recipe_id: testRecipe.id,
    date: '2026-09-14', meal_type: 'breakfast', position: 0, recipe: testRecipe }],
}
export const testShoppingList: ShoppingList = {
  id: 'test-list', user_id: testBaby.user_id, meal_plan_id: testPlan.id, created_at: '2026-09-14',
  shopping_list_items: [{ id: 'test-shopping-item', shopping_list_id: 'test-list',
    ingredient_id: testIngredient.id, quantity: 2, unit: 'unidades', checked: false,
    ingredient: testIngredient }],
}
