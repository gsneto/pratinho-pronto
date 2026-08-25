import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { AuthStateScreen } from './AuthStateScreen'

export function ProtectedRoute() {
  const { errorMessage, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <AuthStateScreen />
  }

  if (status === 'configuration-error') {
    return (
      <AuthStateScreen
        description="Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local."
        title="Supabase ainda não configurado"
        variant="error"
      />
    )
  }

  if (status === 'error') {
    return (
      <AuthStateScreen
        description={errorMessage ?? undefined}
        title="Não foi possível recuperar sua sessão"
        variant="error"
      />
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  return <Outlet />
}
