import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listFavoriteRecipeIds, setRecipeFavorite } from '../services/favorites'

export const favoritesQueryKey = ['recipe-favorites'] as const

export function useFavorites() {
  return useQuery({
    queryFn: listFavoriteRecipeIds,
    queryKey: favoritesQueryKey,
    staleTime: 60_000,
  })
}

export function useFavoriteRecipe(recipeId: string) {
  const queryClient = useQueryClient()
  const { data: favoriteIds = [] } = useQuery({
    queryFn: listFavoriteRecipeIds,
    queryKey: favoritesQueryKey,
    staleTime: 60_000,
  })
  const mutation = useMutation({
    mutationFn: (favorite: boolean) => setRecipeFavorite(recipeId, favorite),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: favoritesQueryKey }),
  })

  return {
    isFavorite: favoriteIds.includes(recipeId),
    isSaving: mutation.isPending,
    toggle: () => mutation.mutate(!favoriteIds.includes(recipeId)),
  }
}
