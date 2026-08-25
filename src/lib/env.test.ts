import { describe, expect, it } from 'vitest'
import { getSupabaseConfig } from './env'

describe('getSupabaseConfig', () => {
  it('returns null when the environment is incomplete', () => {
    expect(getSupabaseConfig({})).toBeNull()
    expect(
      getSupabaseConfig({ VITE_SUPABASE_URL: 'https://example.supabase.co' }),
    ).toBeNull()
  })

  it('normalizes a complete public configuration', () => {
    expect(
      getSupabaseConfig({
        VITE_SUPABASE_URL: ' https://example.supabase.co ',
        VITE_SUPABASE_ANON_KEY: ' public-anon-key ',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'public-anon-key',
    })
  })
})
