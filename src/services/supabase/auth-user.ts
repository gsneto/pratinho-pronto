import { getSupabaseClient } from './client'

export async function getAuthenticatedUserId(): Promise<string> {
  const { data, error } = await getSupabaseClient().auth.getUser()

  if (error || !data.user) {
    throw error ?? new Error('Sessão não encontrada.')
  }

  return data.user.id
}
