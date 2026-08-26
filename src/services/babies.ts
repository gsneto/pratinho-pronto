import type { Baby, BabyInput } from '../types/domain'
import { getAuthenticatedUserId } from './supabase/auth-user'
import { getSupabaseClient } from './supabase/client'

const babyFields =
  'id,user_id,name,birth_date,restrictions,known_allergens,avoided_foods,notes,photo_path,created_at,updated_at'

const babyPhotoBucket = 'baby-photos'

async function attachPhotoUrl(baby: Omit<Baby, 'photo_url'>): Promise<Baby> {
  if (!baby.photo_path) return { ...baby, photo_url: null }

  const { data, error } = await getSupabaseClient()
    .storage
    .from(babyPhotoBucket)
    .createSignedUrl(baby.photo_path, 60 * 60)

  return { ...baby, photo_url: error ? null : data.signedUrl }
}

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
  return data ? attachPhotoUrl(data as Omit<Baby, 'photo_url'>) : null
}

export async function createBaby(input: BabyInput): Promise<Baby> {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await getSupabaseClient()
    .from('babies')
    .insert({ ...input, user_id: userId })
    .select(babyFields)
    .single()

  if (error) throw error
  return attachPhotoUrl(data as Omit<Baby, 'photo_url'>)
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
  return attachPhotoUrl(data as Omit<Baby, 'photo_url'>)
}

export async function uploadBabyPhoto(baby: Baby, photo: Blob): Promise<void> {
  const userId = await getAuthenticatedUserId()
  const photoPath = `${userId}/${baby.id}/profile-${Date.now()}.webp`
  const client = getSupabaseClient()

  const { error: uploadError } = await client.storage
    .from(babyPhotoBucket)
    .upload(photoPath, photo, {
      cacheControl: '31536000',
      contentType: 'image/webp',
    })

  if (uploadError) throw uploadError

  const { error: updateError } = await client
    .from('babies')
    .update({ photo_path: photoPath })
    .eq('id', baby.id)
    .eq('user_id', userId)

  if (updateError) {
    await client.storage.from(babyPhotoBucket).remove([photoPath])
    throw updateError
  }

  if (baby.photo_path) {
    await client.storage.from(babyPhotoBucket).remove([baby.photo_path])
  }
}

export async function removeBabyPhoto(baby: Baby): Promise<void> {
  if (!baby.photo_path) return

  const userId = await getAuthenticatedUserId()
  const client = getSupabaseClient()
  const { error: updateError } = await client
    .from('babies')
    .update({ photo_path: null })
    .eq('id', baby.id)
    .eq('user_id', userId)

  if (updateError) throw updateError

  await client.storage
    .from(babyPhotoBucket)
    .remove([baby.photo_path])
}
