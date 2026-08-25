import { Link, Navigate } from 'react-router-dom'
import { AuthStateScreen } from '../../components/auth/AuthStateScreen'
import { useAuth } from '../../hooks/useAuth'

export function AuthCallbackPage() {
  const { errorMessage, status } = useAuth()

  if (status === 'loading') {
    return (
      <AuthStateScreen
        description="Estamos confirmando seu link e preparando o Pratinho Pronto."
        title="Confirmando seu acesso…"
      />
    )
  }

  if (status === 'authenticated') {
    return <Navigate replace to="/app" />
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cream-50 px-5 text-center">
      <div className="w-full max-w-sm rounded-[26px] border border-cream-100 bg-white p-7 shadow-[0_18px_50px_rgba(65,65,60,0.06)]">
        <p className="text-sm font-semibold text-terracotta-500">Acesso não confirmado</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-ink-900">
          Este link não pôde ser usado
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-500">
          {status === 'configuration-error'
            ? 'O Supabase ainda não está configurado neste ambiente.'
            : errorMessage ??
              'O link pode ter expirado ou já ter sido utilizado. Solicite um novo acesso.'}
        </p>
        <Link
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-sage-600 px-5 text-sm font-semibold text-white"
          to="/login"
        >
          Voltar para o login
        </Link>
      </div>
    </main>
  )
}
