import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Check, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { BrandMark } from '../../components/ui/BrandMark'
import { useAuth } from '../../hooks/useAuth'
import { getAuthErrorMessage } from '../../lib/auth-errors'
import { loginSchema, type LoginFormData } from '../../lib/schemas/auth'
import { createPasswordAccess, signInWithPassword } from '../../services/auth'

const accessBenefits = [
  'Acesso liberado após a confirmação do pagamento',
  'Uma senha escolhida por você',
  'Seus planejamentos ficam protegidos',
]

type AccessMode = 'login' | 'first-access'

export function LoginPage() {
  const { status } = useAuth()
  const [mode, setMode] = useState<AccessMode>('login')
  const [serverError, setServerError] = useState<string | null>(null)
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [confirmationError, setConfirmationError] = useState<string | null>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
  })

  const isConfigured = status !== 'configuration-error'
  const isFirstAccess = mode === 'first-access'

  function changeMode(nextMode: AccessMode) {
    setMode(nextMode)
    setServerError(null)
    setConfirmationError(null)
    setPasswordConfirmation('')
    reset({ email: '', password: '' })
  }

  async function onSubmit({ email, password }: LoginFormData) {
    setServerError(null)
    setConfirmationError(null)

    if (isFirstAccess && password !== passwordConfirmation) {
      setConfirmationError('As senhas precisam ser iguais.')
      return
    }

    try {
      if (isFirstAccess) {
        await createPasswordAccess(email, password)
      } else {
        await signInWithPassword(email, password)
      }
    } catch (error) {
      setServerError(getAuthErrorMessage(error))
    }
  }

  return (
    <main className="min-h-screen bg-cream-50 px-5 py-7 sm:px-8 sm:py-10 lg:grid lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:px-12">
      <section className="mx-auto flex w-full max-w-xl flex-col lg:justify-between lg:py-2">
        <BrandMark />
        <div className="mt-12 hidden lg:block">
          <p className="text-sm font-semibold text-terracotta-500">Seu acesso ao Pratinho Pronto</p>
          <h1 className="mt-3 max-w-lg text-5xl leading-[1.05] font-semibold tracking-[-0.045em] text-ink-900">
            Uma semana mais leve começa com um plano pronto.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-ink-500">
            Use o e-mail informado na compra e organize as refeições do seu bebê de um jeito simples.
          </p>
          <ul className="mt-8 space-y-3">
            {accessBenefits.map((benefit) => (
              <li className="flex items-center gap-3 text-sm text-ink-700" key={benefit}>
                <span className="grid size-7 place-items-center rounded-full bg-sage-100 text-sage-700">
                  <Check aria-hidden="true" size={15} strokeWidth={2.4} />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-10 hidden max-w-md text-xs leading-5 text-ink-500 lg:block">
          O Pratinho Pronto é uma ferramenta de organização alimentar e não substitui orientação individual de pediatra ou nutricionista.
        </p>
      </section>

      <section className="mx-auto mt-10 flex w-full max-w-lg items-center lg:mt-0">
        <div className="w-full rounded-[28px] border border-cream-100 bg-white p-6 shadow-[0_22px_60px_rgba(65,65,60,0.07)] sm:p-9">
          <span className="grid size-12 place-items-center rounded-2xl bg-sage-50 text-sage-700">
            <LockKeyhole aria-hidden="true" size={22} strokeWidth={1.8} />
          </span>
          <p className="mt-6 text-sm font-semibold text-terracotta-500">
            {isFirstAccess ? 'Primeiro acesso' : 'Acesso liberado para clientes'}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink-900 sm:text-4xl">
            {isFirstAccess ? 'Crie sua senha' : 'Entre no Pratinho Pronto'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-500">
            {isFirstAccess
              ? 'Use o mesmo e-mail da compra e escolha uma senha para entrar no app.'
              : 'Digite o e-mail usado na compra e sua senha.'}
          </p>

          {!isConfigured && (
            <div className="mt-5 rounded-2xl border border-terracotta-100 bg-terracotta-100/45 p-4 text-sm leading-6 text-ink-700" role="alert">
              O ambiente ainda não está conectado ao Supabase. Configure as variáveis públicas no arquivo <code>.env.local</code>.
            </div>
          )}

          <form className="mt-7" noValidate onSubmit={handleSubmit(onSubmit)}>
            <label className="text-sm font-semibold text-ink-700" htmlFor="email">E-mail da compra</label>
            <input
              {...register('email')}
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
              className="mt-2 min-h-14 w-full rounded-2xl border border-cream-100 bg-cream-50 px-4 text-base text-ink-900 placeholder:text-ink-500/65 focus:border-sage-500 focus:bg-white focus:outline-none"
              id="email"
              inputMode="email"
              placeholder="voce@email.com"
              type="email"
            />
            {errors.email && <p className="mt-2 text-sm text-terracotta-500" id="email-error">{errors.email.message}</p>}

            <label className="mt-5 block text-sm font-semibold text-ink-700" htmlFor="password">Senha</label>
            <input
              {...register('password')}
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={Boolean(errors.password)}
              autoComplete={isFirstAccess ? 'new-password' : 'current-password'}
              className="mt-2 min-h-14 w-full rounded-2xl border border-cream-100 bg-cream-50 px-4 text-base text-ink-900 placeholder:text-ink-500/65 focus:border-sage-500 focus:bg-white focus:outline-none"
              id="password"
              placeholder="Mínimo de 8 caracteres"
              type="password"
            />
            {errors.password && <p className="mt-2 text-sm text-terracotta-500" id="password-error">{errors.password.message}</p>}

            {isFirstAccess && (
              <>
                <label className="mt-5 block text-sm font-semibold text-ink-700" htmlFor="password-confirmation">Repita a senha</label>
                <input
                  aria-invalid={Boolean(confirmationError)}
                  autoComplete="new-password"
                  className="mt-2 min-h-14 w-full rounded-2xl border border-cream-100 bg-cream-50 px-4 text-base text-ink-900 placeholder:text-ink-500/65 focus:border-sage-500 focus:bg-white focus:outline-none"
                  id="password-confirmation"
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  placeholder="Repita sua senha"
                  type="password"
                  value={passwordConfirmation}
                />
                {confirmationError && <p className="mt-2 text-sm text-terracotta-500">{confirmationError}</p>}
              </>
            )}

            {serverError && <p className="mt-3 text-sm leading-5 text-terracotta-500" role="alert">{serverError}</p>}
            <button
              className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-pumpkin px-5 text-base font-medium text-[#2A2A22] transition-colors enabled:hover:bg-pumpkin/90 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={!isConfigured || isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Aguarde…' : isFirstAccess ? 'Criar senha e entrar' : 'Entrar no app'}
              {!isSubmitting && <ArrowRight aria-hidden="true" size={19} />}
            </button>
          </form>

          <div className="mt-6 border-t border-cream-100 pt-5 text-center">
            <button className="text-sm font-semibold text-sage-700 underline-offset-4 hover:underline" onClick={() => changeMode(isFirstAccess ? 'login' : 'first-access')} type="button">
              {isFirstAccess ? 'Já criei minha senha — entrar' : 'É seu primeiro acesso? Criar senha'}
            </button>
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-500">
            <ShieldCheck aria-hidden="true" size={15} />
            Seus dados ficam protegidos pelo Supabase.
          </p>
        </div>
      </section>
      <p className="mx-auto mt-8 max-w-lg text-center text-xs leading-5 text-ink-500 lg:hidden">
        O Pratinho Pronto é uma ferramenta de organização alimentar e não substitui orientação individual de pediatra ou nutricionista.
      </p>
    </main>
  )
}
