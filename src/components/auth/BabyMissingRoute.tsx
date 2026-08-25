import { Navigate, Outlet } from 'react-router-dom'
import { useBaby } from '../../hooks/useBaby'
import { AuthStateScreen } from './AuthStateScreen'

export function BabyMissingRoute() {
  const { data: baby, error, isLoading } = useBaby()

  if (isLoading) {
    return <AuthStateScreen description="Estamos preparando seu primeiro acesso." />
  }

  if (error) {
    return (
      <AuthStateScreen
        description="Não foi possível consultar o cadastro. Verifique a conexão e as migrations do Supabase."
        title="Cadastro indisponível"
        variant="error"
      />
    )
  }

  if (baby) {
    return <Navigate replace to="/app" />
  }

  return <Outlet />
}
