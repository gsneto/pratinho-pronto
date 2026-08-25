import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfig } from '../../lib/env'

let browserClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseConfig) {
    throw new Error(
      'Supabase não configurado. Copie .env.example para .env.local e preencha as variáveis públicas.',
    )
  }

  if (!browserClient) {
    browserClient = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  }

  return browserClient
}
