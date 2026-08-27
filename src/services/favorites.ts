import { getAuthenticatedUserId } from './supabase/auth-user'
import { getSupabaseClient } from './supabase/client'

function localKey(userId: string) {
  return `pratinho-favorites:${userId}`
}

function readLocalFavorites(userId: string): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(localKey(userId)) ?? '[]') as string[]
  } catch {
    return []
  }
}

function writeLocalFavorites(userId: string, recipeIds: string[]) {
  window.localStorage.setItem(localKey(userId), JSON.stringify(recipeIds))
}

export async function listFavoriteRecipeIds(): Promise<string[]> {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await getSupabaseClient()
    .from('recipe_favorites')
    .select('recipe_id')
    .eq('user_id', userId)

  if (error) return readLocalFavorites(userId)
  return (data ?? []).map((item) => item.recipe_id as string)
}

export async function setRecipeFavorite(recipeId: string, favorite: boolean): Promise<void> {
  const userId = await getAuthenticatedUserId()
  const client = getSupabaseClient()

  if (favorite) {
    const { error } = await client
      .from('recipe_favorites')
      .upsert({ recipe_id: recipeId, user_id: userId }, { onConflict: 'user_id,recipe_id' })
    if (error) {
      const ids = new Set(readLocalFavorites(userId))
      ids.add(recipeId)
      writeLocalFavorites(userId, [...ids])
    }
    return
  }

  const { error } = await client
    .from('recipe_favorites')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('user_id', userId)
  if (error) {
    writeLocalFavorites(userId, readLocalFavorites(userId).filter((id) => id !== recipeId))
  }
}
