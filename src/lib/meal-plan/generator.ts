import type {
  Baby,
  GeneratedMealPlanItem,
  MealType,
  Recipe,
} from '../../types/domain'
import { addDays, calculateAgeMonths, parseIsoDate } from '../../utils/dates'
import { normalizeTerm } from '../../utils/text'

function stableHash(value: string): number {
  return [...value].reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) >>> 0
  }, 0)
}

function recipeTerms(recipe: Recipe): string[] {
  return [
    ...recipe.recipe_allergens.map((item) => item.allergen),
    ...recipe.recipe_ingredients.map((item) => item.ingredient.name),
  ].map(normalizeTerm)
}

function babyBlockedTerms(baby: Baby): string[] {
  return [
    ...baby.restrictions,
    ...baby.known_allergens,
    ...baby.avoided_foods,
  ].map(normalizeTerm)
}

export function isRecipeCompatible(
  baby: Baby,
  recipe: Recipe,
  referenceDate: Date,
): boolean {
  if (recipe.min_age_months > calculateAgeMonths(baby.birth_date, referenceDate)) {
    return false
  }

  const blocked = babyBlockedTerms(baby)
  const terms = recipeTerms(recipe)

  return !blocked.some((blockedTerm) =>
    terms.some(
      (term) => term.includes(blockedTerm) || blockedTerm.includes(term),
    ),
  )
}

export function getCompatibleRecipes(
  baby: Baby,
  recipes: Recipe[],
  mealType: MealType,
  referenceDate: Date,
  excludedRecipeId?: string,
): Recipe[] {
  return recipes
    .filter(
      (recipe) =>
        recipe.is_active &&
        recipe.meal_type === mealType &&
        recipe.id !== excludedRecipeId &&
        isRecipeCompatible(baby, recipe, referenceDate),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export interface GenerateWeeklyMealPlanInput {
  baby: Baby
  recipes: Recipe[]
  selectedMealTypes: MealType[]
  weekStart: string
}

export function generateWeeklyMealPlan({
  baby,
  recipes,
  selectedMealTypes,
  weekStart,
}: GenerateWeeklyMealPlanInput): GeneratedMealPlanItem[] {
  const recipeUsage = new Map<string, number>()
  const ingredientUsage = new Map<string, number>()
  const result: GeneratedMealPlanItem[] = []

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const date = addDays(weekStart, dayIndex)
    const referenceDate = parseIsoDate(date)

    for (const mealType of selectedMealTypes) {
      const candidates = getCompatibleRecipes(
        baby,
        recipes,
        mealType,
        referenceDate,
      )

      if (candidates.length === 0) continue

      const rotation = stableHash(`${weekStart}:${mealType}`) % candidates.length
      const ordered = candidates
        .map((recipe, index) => ({ recipe, rotationIndex: (index - rotation + candidates.length) % candidates.length }))
        .sort((a, b) => {
          const aRecipeUses = recipeUsage.get(a.recipe.id) ?? 0
          const bRecipeUses = recipeUsage.get(b.recipe.id) ?? 0
          if (aRecipeUses !== bRecipeUses) return aRecipeUses - bRecipeUses

          const aIngredientUses = a.recipe.recipe_ingredients.reduce(
            (total, item) => total + (ingredientUsage.get(item.ingredient_id) ?? 0),
            0,
          )
          const bIngredientUses = b.recipe.recipe_ingredients.reduce(
            (total, item) => total + (ingredientUsage.get(item.ingredient_id) ?? 0),
            0,
          )
          if (aIngredientUses !== bIngredientUses) return aIngredientUses - bIngredientUses
          return a.rotationIndex - b.rotationIndex
        })

      const chosen = ordered[0].recipe
      recipeUsage.set(chosen.id, (recipeUsage.get(chosen.id) ?? 0) + 1)
      chosen.recipe_ingredients.forEach((item) => {
        ingredientUsage.set(
          item.ingredient_id,
          (ingredientUsage.get(item.ingredient_id) ?? 0) + 1,
        )
      })
      result.push({
        date,
        meal_type: mealType,
        position: 0,
        recipe: chosen,
        recipe_id: chosen.id,
      })
    }
  }

  return result
}
