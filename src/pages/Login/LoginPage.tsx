import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Check, Mail, MailCheck, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { BrandMark } from '../../components/ui/BrandMark'
import { useAuth } from '../../hooks/useAuth'
import { getAuthErrorMessage } from '../../lib/auth-errors'
import { loginSchema, type LoginFormData } from '../../lib/schemas/auth'
import { requestMagicLink } from '../../services/auth'

const accessBenefits = [
  'Sem senha para lembrar',
  'Sessão recuperada com segurança',
  'Seus planejamentos ficam protegidos',
]

export function LoginPage() {
  const { status } = useAuth()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<LoginFormData>({
    defaultValues: { email: '' },
    resolver: zodResolver(loginSchema),
  })

  const isConfigured = status !== 'configuration-error'

  async function onSubmit({ email }: LoginFormData) {
    setServerError(null)

    try {
      await requestMagicLink(email)
      setSentTo(email)
    } catch (error) {
      setServerError(getAuthErrorMessage(error))
    }
  }

  function startAgain() {
    setSentTo(null)
    setServerError(null)
    reset()
  }

  return (
    <main className="min-h-screen bg-cream-50 px-5 py-7 sm:px-8 sm:py-10 lg:grid lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:px-12">
      <section className="mx-auto flex w-full max-w-xl flex-col lg:justify-between lg:py-2">
        <BrandMark />

        <div className="mt-12 hidden lg:block">
          <p className="text-sm font-semibold text-terracotta-500">
            Sua rotina começa por aqui
          </p>
          <h1 className="mt-3 max-w-lg text-5xl leading-[1.05] font-semibold tracking-[-0.045em] text-ink-900">
            Menos tempo decidindo. Mais clareza para a semana.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-ink-500">
            Entre para organizar as refeições do seu bebê de um jeito leve,
            prático e pensado para a sua rotina.
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
          O Pratinho Pronto é uma ferramenta de organização alimentar e não
          substitui orientação individual de pediatra ou nutricionista.
        </p>
      </section>

      <section className="mx-auto mt-10 flex w-full max-w-lg items-center lg:mt-0">
        <div className="w-full rounded-[28px] border border-cream-100 bg-white p-6 shadow-[0_22px_60px_rgba(65,65,60,0.07)] sm:p-9">
          {sentTo ? (
            <div aria-live="polite" className="text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-[18px] bg-sage-100 text-sage-700">
                <MailCheck aria-hidden="true" size={26} strokeWidth={1.8} />
              </span>
              <p className="mt-6 text-sm font-semibold text-terracotta-500">
                Link enviado
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink-900">
                Agora confira seu e-mail
              </h1>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                Enviamos um link de acesso para{' '}
                <strong className="font-semibold text-ink-700">{sentTo}</strong>.
                Clique nele para entrar no Pratinho Pronto.
              </p>
              <div className="mt-6 rounded-2xl bg-cream-50 p-4 text-left text-xs leading-5 text-ink-500">
                O e-mail pode levar alguns minutos. Confira também as pastas de
                spam e promoções.
              </div>
              <button
                className="mt-6 min-h-12 w-full rounded-2xl border border-cream-100 bg-white px-5 text-sm font-semibold text-sage-700"
                onClick={startAgain}
                type="button"
              >
                Usar outro e-mail
              </button>
            </div>
          ) : (
            <>
              <span className="grid size-12 place-items-center rounded-2xl bg-sage-50 text-sage-700">
                <Mail aria-hidden="true" size={22} strokeWidth={1.8} />
              </span>
              <p className="mt-6 text-sm font-semibold text-terracotta-500">
                Acesso simples e seguro
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink-900 sm:text-4xl">
                Entre no Pratinho Pronto
              </h1>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                Digite seu e-mail. Você receberá um link seguro para entrar, sem
                precisar criar uma senha.
              </p>

              {!isConfigured && (
                <div
                  className="mt-5 rounded-2xl border border-terracotta-100 bg-terracotta-100/45 p-4 text-sm leading-6 text-ink-700"
                  role="alert"
                >
                  O ambiente ainda não está conectado ao Supabase. Configure as
                  variáveis públicas no arquivo <code>.env.local</code>.
                </div>
              )}

              <form className="mt-7" noValidate onSubmit={handleSubmit(onSubmit)}>
                <label className="text-sm font-semibold text-ink-700" htmlFor="email">
                  Seu melhor e-mail
                </label>
                <div className="relative mt-2">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-500"
                    size={19}
                    strokeWidth={1.8}
                  />
                  <input
                    {...register('email')}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    aria-invalid={Boolean(errors.email)}
                    autoComplete="email"
                    className="min-h-14 w-full rounded-2xl border border-cream-100 bg-cream-50 py-3 pr-4 pl-12 text-base text-ink-900 placeholder:text-ink-500/65 focus:border-sage-500 focus:bg-white focus:outline-none"
                    id="email"
                    inputMode="email"
                    placeholder="voce@email.com"
                    type="email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-terracotta-500" id="email-error">
                    {errors.email.message}
                  </p>
                )}
                {serverError && (
                  <p className="mt-3 text-sm leading-5 text-terracotta-500" role="alert">
                    {serverError}
                  </p>
                )}

                <button
                  className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-pumpkin px-5 text-base font-medium text-[#2A2A22] transition-colors enabled:hover:bg-pumpkin/90 disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={!isConfigured || isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Enviando link…' : 'Receber link de acesso'}
                  {!isSubmitting && <ArrowRight aria-hidden="true" size={19} />}
                </button>
              </form>

              <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-500">
                <ShieldCheck aria-hidden="true" size={15} />
                Seu link é individual e temporário.
              </p>
            </>
          )}
        </div>
      </section>

      <p className="mx-auto mt-8 max-w-lg text-center text-xs leading-5 text-ink-500 lg:hidden">
        O Pratinho Pronto é uma ferramenta de organização alimentar e não
        substitui orientação individual de pediatra ou nutricionista.
      </p>
    </main>
  )
}
