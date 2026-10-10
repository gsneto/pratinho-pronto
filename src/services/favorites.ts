import { getAuthenticatedUserId } from './supabase/auth-user'
import { getSupabaseClient } from './supabase/client'
import {
  appliedPending,
  applyFavoritePending,
  clearPending,
  recordPending,
  type FavoritePending,
} from '../lib/favorites/pending'

function cacheKey(userId: string) {
  return `pratinho-favorites:${userId}`
}

function pendingKey(userId: string) {
  return `pratinho-favorites-pending:${userId}`
}

function readCache(userId: string): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(cacheKey(userId)) ?? '[]') as string[]
  } catch {
    return []
  }
}

function writeCache(userId: string, recipeIds: string[]) {
  window.localStorage.setItem(cacheKey(userId), JSON.stringify(recipeIds))
}

function readPending(userId: string): FavoritePending {
  try {
    const value = JSON.parse(window.localStorage.getItem(pendingKey(userId)) ?? '{}') as FavoritePending
    return value && typeof value === 'object' ? value : {}
  } catch {
    return {}
  }
}

function writePending(userId: string, pending: FavoritePending) {
  if (Object.keys(pending).length === 0) window.localStorage.removeItem(pendingKey(userId))
  else window.localStorage.setItem(pendingKey(userId), JSON.stringify(pending))
}

type Client = ReturnType<typeof getSupabaseClient>

/** Aplica uma operação no servidor; devolve true se foi confirmada. */
async function pushOperation(
  client: Client,
  userId: string,
  recipeId: string,
  favorite: boolean,
): Promise<boolean> {
  const { error } = favorite
    ? await client
        .from('recipe_favorites')
        .upsert({ recipe_id: recipeId, user_id: userId }, { onConflict: 'user_id,recipe_id' })
    : await client
        .from('recipe_favorites')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', userId)
  return !error
}

async function flushPending(
  client: Client,
  userId: string,
  pending: FavoritePending,
): Promise<FavoritePending> {
  const remaining: FavoritePending = {}
  for (const [recipeId, favorite] of Object.entries(pending)) {
    const ok = await pushOperation(client, userId, recipeId, favorite)
    if (!ok) remaining[recipeId] = favorite
  }
  return remaining
}

export async function listFavoriteRecipeIds(): Promise<string[]> {
  const userId = await getAuthenticatedUserId()
  const client = getSupabaseClient()
  const pending = readPending(userId)

  const { data, error } = await client
    .from('recipe_favorites')
    .select('recipe_id')
    .eq('user_id', userId)

  // Offline: mostra o último estado conhecido com a fila aplicada por cima.
  if (error) {
    return applyFavoritePending(readCache(userId), pending)
  }

  let base = (data ?? []).map((item) => item.recipe_id as string)

  // Online com pendências: tenta sincronizar; guarda só o que falhou.
  if (Object.keys(pending).length > 0) {
    const remaining = await flushPending(client, userId, pending)
    writePending(userId, remaining)
    const applied = appliedPending(pending, remaining)
    // Estado confirmado no servidor = base + operações aplicadas com sucesso.
    base = applyFavoritePending(base, applied)
  }

  writeCache(userId, base)
  // Ainda aplica pendências restantes para refletir a intenção do usuário.
  return applyFavoritePending(base, readPending(userId))
}

export async function setRecipeFavorite(recipeId: string, favorite: boolean): Promise<void> {
  const userId = await getAuthenticatedUserId()
  const client = getSupabaseClient()
  const ok = await pushOperation(client, userId, recipeId, favorite)

  if (ok) {
    // Servidor confere: remove qualquer pendência desse item.
    writePending(userId, clearPending(readPending(userId), recipeId))
    return
  }

  // Falhou: registra a intenção para sincronizar depois (não perde o gesto).
  writePending(userId, recordPending(readPending(userId), recipeId, favorite))
}
