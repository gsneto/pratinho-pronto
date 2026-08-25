import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from './supabase/client'

export function buildAuthCallbackUrl(origin: string): string {
  return `${origin.replace(/\/$/, '')}/auth/callback`
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await getSupabaseClient().auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}

export function subscribeToAuthChanges(
  onChange: (event: AuthChangeEvent, session: Session | null) => void,
) {
  const { data } = getSupabaseClient().auth.onAuthStateChange(onChange)
  return data.subscription
}

export async function requestMagicLink(email: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(window.location.origin),
      shouldCreateUser: true,
    },
  })

  if (error) {
    throw error
  }
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' })

  if (error) {
    throw error
  }
}
