import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { AuthStateScreen } from './AuthStateScreen'

export function GuestRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <AuthStateScreen />
  }

  if (status === 'authenticated') {
    return <Navigate replace to="/app" />
  }

  return <Outlet />
}
