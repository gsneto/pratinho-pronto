import { useQuery } from '@tanstack/react-query'
import { getRecipe, listIngredients, listRecipes, listRecipeReviewStatuses } from '../services/recipes'

export const recipesQueryKey = ['recipes'] as const
export const ingredientsQueryKey = ['ingredients'] as const
export const recipeReviewQueryKey = ['recipes', 'review-status'] as const

export function useRecipes() {
  return useQuery({
    queryFn: listRecipes,
    queryKey: recipesQueryKey,
    staleTime: 10 * 60_000,
  })
}

export function useRecipe(recipeId: string | undefined) {
  return useQuery({
    enabled: Boolean(recipeId),
    queryFn: () => getRecipe(recipeId ?? ''),
    queryKey: [...recipesQueryKey, recipeId],
    staleTime: 10 * 60_000,
  })
}

export function useIngredients() {
  return useQuery({
    queryFn: listIngredients,
    queryKey: ingredientsQueryKey,
    staleTime: 10 * 60_000,
  })
}

/**
 * Status de revisão do catálogo. `data` é `null` quando o schema atual não
 * expõe a coluna — nesse caso a interface simplesmente não mostra indicador.
 */
export function useRecipeReviewStatuses() {
  return useQuery({
    queryFn: listRecipeReviewStatuses,
    queryKey: recipeReviewQueryKey,
    staleTime: 10 * 60_000,
  })
}
