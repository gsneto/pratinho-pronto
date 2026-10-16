/**
 * Reconciliação de favoritos online/offline.
 *
 * Modelo: o servidor é a fonte de verdade; o armazenamento local guarda
 * (a) um cache do último estado confirmado e (b) uma fila de operações
 * pendentes (mapa recipeId -> favorito desejado). A fila é um delta, não o
 * conjunto inteiro, então uma remoção offline continua escondendo um item que
 * ainda exista no servidor — evitando que favoritos antigos reapareçam.
 */
export type FavoritePending = Record<string, boolean>

/** Aplica a fila de pendências sobre uma base (último estado do servidor). */
export function applyFavoritePending(base: string[], pending: FavoritePending): string[] {
  const set = new Set(base)
  for (const [recipeId, favorite] of Object.entries(pending)) {
    if (favorite) set.add(recipeId)
    else set.delete(recipeId)
  }
  return [...set]
}

/** Registra/atualiza a intenção para um item (última escrita vence). */
export function recordPending(
  pending: FavoritePending,
  recipeId: string,
  favorite: boolean,
): FavoritePending {
  return { ...pending, [recipeId]: favorite }
}

/** Remove a pendência de um item (quando o servidor já reflete o estado). */
export function clearPending(pending: FavoritePending, recipeId: string): FavoritePending {
  const next = { ...pending }
  delete next[recipeId]
  return next
}

/** Operações que foram aplicadas com sucesso (as que não sobraram na fila). */
export function appliedPending(
  pending: FavoritePending,
  remaining: FavoritePending,
): FavoritePending {
  const next: FavoritePending = {}
  for (const [recipeId, favorite] of Object.entries(pending)) {
    if (!(recipeId in remaining)) next[recipeId] = favorite
  }
  return next
}
