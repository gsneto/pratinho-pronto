import { Navigate, Outlet } from 'react-router-dom'
import { useBaby } from '../../hooks/useBaby'
import { AuthStateScreen } from './AuthStateScreen'

export function BabyRequiredRoute() {
  const { data: baby, error, isLoading } = useBaby()

  if (isLoading) {
    return <AuthStateScreen description="Estamos carregando os dados do bebê." />
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

  if (!baby) {
    return <Navigate replace to="/onboarding" />
  }

  return <Outlet />
}
