import type { Baby, Recipe } from '../../types/domain'
import { isRecipeCompatible } from '../meal-plan/generator'

export interface RankedPantryRecipe {
  canMakeNow: boolean
  matchedCount: number
  missingIngredientNames: string[]
  recipe: Recipe
  score: number
  totalRequired: number
}

export interface RankPantryRecipesInput {
  baby: Baby
  recipes: Recipe[]
  referenceDate?: Date
  selectedIngredientIds: string[]
}

export function rankRecipesByPantry({
  baby,
  recipes,
  referenceDate = new Date(),
  selectedIngredientIds,
}: RankPantryRecipesInput): RankedPantryRecipe[] {
  const selected = new Set(selectedIngredientIds)

  return recipes
    .filter((recipe) => isRecipeCompatible(baby, recipe, referenceDate))
    .map((recipe) => {
      const required = recipe.recipe_ingredients.filter((item) => !item.is_optional)
      const matchedCount = required.filter((item) => selected.has(item.ingredient_id)).length
      const missingIngredientNames = required
        .filter((item) => !selected.has(item.ingredient_id))
        .map((item) => item.ingredient.name)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      const totalRequired = required.length
      return {
        canMakeNow: totalRequired > 0 && matchedCount === totalRequired,
        matchedCount,
        missingIngredientNames,
        recipe,
        score: totalRequired === 0 ? 0 : matchedCount / totalRequired,
        totalRequired,
      }
    })
    .filter((item) => item.matchedCount > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.matchedCount - a.matchedCount ||
        a.recipe.prep_time_minutes - b.recipe.prep_time_minutes ||
        a.recipe.name.localeCompare(b.recipe.name, 'pt-BR'),
    )
}
