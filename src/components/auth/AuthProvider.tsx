import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthContext } from '../../lib/auth-context'
import { getAuthErrorMessage } from '../../lib/auth-errors'
import { isSupabaseConfigured } from '../../lib/env'
import type { AuthContextValue, AuthStatus } from '../../types/auth'

interface AuthProviderProps {
  children: ReactNode
}

function statusFromSession(session: Session | null): AuthStatus {
  return session ? 'authenticated' : 'unauthenticated'
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? 'loading' : 'configuration-error',
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    let isMounted = true
    let unsubscribe: (() => void) | undefined

    void import('../../services/auth')
      .then(async ({ getCurrentSession, subscribeToAuthChanges }) => {
        if (!isMounted) return

        const subscription = subscribeToAuthChanges((_event, nextSession) => {
          if (!isMounted) return

          setSession(nextSession)
          setStatus(statusFromSession(nextSession))
          setErrorMessage(null)
        })
        unsubscribe = () => subscription.unsubscribe()

        const currentSession = await getCurrentSession()
        if (!isMounted) return

        setSession(currentSession)
        setStatus(statusFromSession(currentSession))
      })
      .catch((error: unknown) => {
        if (!isMounted) return

        setStatus('error')
        setErrorMessage(getAuthErrorMessage(error))
      })

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [])

  const logout = useCallback(async () => {
    const { signOut } = await import('../../services/auth')
    await signOut()
    setSession(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      errorMessage,
      logout,
      session,
      status,
      user: session?.user ?? null,
    }),
    [errorMessage, logout, session, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
