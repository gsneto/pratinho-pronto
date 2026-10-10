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
    // Atualização otimista: o coração muda na hora, mesmo offline (a operação
    // fica na fila local). O refetch reconcilia com o servidor depois.
    onMutate: async (favorite: boolean) => {
      await queryClient.cancelQueries({ queryKey: favoritesQueryKey })
      const previous = queryClient.getQueryData<string[]>(favoritesQueryKey)
      queryClient.setQueryData<string[]>(favoritesQueryKey, (current = []) => {
        const set = new Set(current)
        if (favorite) set.add(recipeId)
        else set.delete(recipeId)
        return [...set]
      })
      return { previous }
    },
    onError: (_error, _favorite, context) => {
      if (context && context.previous !== undefined) {
        queryClient.setQueryData(favoritesQueryKey, context.previous)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: favoritesQueryKey }),
  })

  return {
    isFavorite: favoriteIds.includes(recipeId),
    isSaving: mutation.isPending,
    toggle: () => mutation.mutate(!favoriteIds.includes(recipeId)),
  }
}
