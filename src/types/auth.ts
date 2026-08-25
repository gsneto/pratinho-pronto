import type { Session, User } from '@supabase/supabase-js'

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'configuration-error'
  | 'error'

export interface AuthContextValue {
  errorMessage: string | null
  logout: () => Promise<void>
  session: Session | null
  status: AuthStatus
  user: User | null
}
