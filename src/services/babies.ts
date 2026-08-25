import type { Baby, BabyInput } from '../types/domain'
import { getAuthenticatedUserId } from './supabase/auth-user'
import { getSupabaseClient } from './supabase/client'

const babyFields =
  'id,user_id,name,birth_date,restrictions,known_allergens,avoided_foods,notes,created_at,updated_at'

export async function getMyBaby(): Promise<Baby | null> {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await getSupabaseClient()
    .from('babies')
    .select(babyFields)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as Baby | null
}

export async function createBaby(input: BabyInput): Promise<Baby> {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await getSupabaseClient()
    .from('babies')
    .insert({ ...input, user_id: userId })
    .select(babyFields)
    .single()

  if (error) throw error
  return data as Baby
}

export async function updateBaby(babyId: string, input: BabyInput): Promise<Baby> {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await getSupabaseClient()
    .from('babies')
    .update(input)
    .eq('id', babyId)
    .eq('user_id', userId)
    .select(babyFields)
    .single()

  if (error) throw error
  return data as Baby
}
