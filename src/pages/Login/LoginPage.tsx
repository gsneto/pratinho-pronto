import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { BrandMark } from '../../components/ui/BrandMark'
import { useAuth } from '../../hooks/useAuth'
import { getAuthErrorMessage } from '../../lib/auth-errors'
import { loginSchema, type LoginFormData } from '../../lib/schemas/auth'
import { createPasswordAccess, signInWithPassword } from '../../services/auth'
import { analytics } from '../../services/analytics'

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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
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
    setIsPasswordVisible(false)
    reset({ email: '', password: '' })
  }

  async function onSubmit({ email, password }: LoginFormData) {
    setServerError(null)
    setConfirmationError(null)

    if (isFirstAccess && password !== passwordConfirmation) {
      setConfirmationError('As senhas precisam ser iguais.')
      return
    }

    analytics.track(isFirstAccess ? 'signup_started' : 'login_started')

    try {
      if (isFirstAccess) {
        await createPasswordAccess(email, password)
        analytics.track('signup_completed')
      } else {
        await signInWithPassword(email, password)
        analytics.track('login_completed')
      }
    } catch (error) {
      setServerError(getAuthErrorMessage(error))
    }
  }

  return (
    <main className="pp-auth">
      <section className="pp-auth-story" aria-label="Sua rotina no Pratinho Pronto">
        <BrandMark />
        <div>
          <p className="text-sm font-semibold text-terracotta-500">Seu acesso ao Pratinho Pronto</p>
          <h2>Uma semana mais leve começa com um plano pronto.</h2>
          <img alt="Mingau de banana e aveia do catálogo" className="pp-auth-photo" src="/images/recipes/mingau-de-banana-e-aveia.webp" width="640" height="360" />
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
        <p className="mt-10 max-w-md text-xs leading-5 text-ink-500">
          O Pratinho Pronto é uma ferramenta de organização alimentar e não substitui orientação individual de pediatra ou nutricionista.
        </p>
      </section>

      <section className="pp-auth-form" aria-labelledby="login-title">
        <div className="pp-mobile-brand"><BrandMark /></div>
        <div>
          <span className="grid size-12 place-items-center rounded-2xl bg-sage-50 text-sage-700">
            <LockKeyhole aria-hidden="true" size={22} strokeWidth={1.8} />
          </span>
          <p className="mt-6 text-sm font-semibold text-terracotta-500">
            {isFirstAccess ? 'Primeiro acesso' : 'Acesso liberado para clientes'}
          </p>
          <h1 className="pp-page-title" id="login-title">
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
              className="pp-field mt-2 min-h-14"
              id="email"
              inputMode="email"
              placeholder="voce@email.com"
              type="email"
            />
            {errors.email && <p className="mt-2 text-sm text-terracotta-500" id="email-error">{errors.email.message}</p>}

            <label className="mt-5 block text-sm font-semibold text-ink-700" htmlFor="password">Senha</label>
            <div className="pp-password-field">
            <input
              {...register('password')}
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={Boolean(errors.password)}
              autoComplete={isFirstAccess ? 'new-password' : 'current-password'}
              className="pp-field mt-2 min-h-14"
              id="password"
              placeholder="Mínimo de 8 caracteres"
              type={isPasswordVisible ? 'text' : 'password'}
            />
            <button aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={isPasswordVisible} aria-controls="password" onClick={() => setIsPasswordVisible((visible) => !visible)} type="button">
              {isPasswordVisible ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
            </button>
            </div>
            {errors.password && <p className="mt-2 text-sm text-terracotta-500" id="password-error">{errors.password.message}</p>}

            {isFirstAccess && (
              <>
                <label className="mt-5 block text-sm font-semibold text-ink-700" htmlFor="password-confirmation">Repita a senha</label>
                <input
                  aria-invalid={Boolean(confirmationError)}
                  aria-describedby={confirmationError ? 'confirmation-error' : undefined}
                  autoComplete="new-password"
                  className="pp-field mt-2 min-h-14"
                  id="password-confirmation"
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  placeholder="Repita sua senha"
                  type="password"
                  value={passwordConfirmation}
                />
                {confirmationError && <p className="mt-2 text-sm text-terracotta-500" id="confirmation-error">{confirmationError}</p>}
              </>
            )}

            {serverError && <p className="mt-3 text-sm leading-5 text-terracotta-500" role="alert">{serverError}</p>}
            <button
              className="pp-btn pp-btn-primary pp-btn-lg mt-6 w-full"
              disabled={!isConfigured || isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Aguarde…' : isFirstAccess ? 'Criar senha e entrar' : 'Entrar no app'}
              {!isSubmitting && <ArrowRight aria-hidden="true" size={19} />}
            </button>
          </form>

          <div className="mt-6 border-t border-cream-100 pt-5 text-center">
            <button className="pp-text-action text-sm underline-offset-4 hover:underline" onClick={() => changeMode(isFirstAccess ? 'login' : 'first-access')} type="button">
              {isFirstAccess ? 'Já criei minha senha — entrar' : 'É seu primeiro acesso? Criar senha'}
            </button>
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-500">
            <ShieldCheck aria-hidden="true" size={15} />
            Seus dados ficam protegidos pelo Supabase.
          </p>
        </div>
      </section>
      <p className="pp-mobile-brand mx-auto mt-8 max-w-lg text-center text-xs leading-5 text-ink-500">
        O Pratinho Pronto é uma ferramenta de organização alimentar e não substitui orientação individual de pediatra ou nutricionista.
      </p>
    </main>
  )
}
