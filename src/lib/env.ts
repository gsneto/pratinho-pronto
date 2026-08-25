export interface PublicEnvironment {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
}

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export function getSupabaseConfig(
  environment: PublicEnvironment = import.meta.env,
): SupabaseConfig | null {
  const url = environment.VITE_SUPABASE_URL?.trim()
  const anonKey = environment.VITE_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    return null
  }

  return { url, anonKey }
}

export const supabaseConfig = getSupabaseConfig()
export const isSupabaseConfigured = supabaseConfig !== null
