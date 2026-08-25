import { useQuery } from '@tanstack/react-query'
import { getRecipe, listIngredients, listRecipes } from '../services/recipes'

export const recipesQueryKey = ['recipes'] as const
export const ingredientsQueryKey = ['ingredients'] as const

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
