import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  ListChecks,
  Refrigerator,
  Salad,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { BabyAvatar, BabyPhotoBackdrop } from '../../components/baby/BabyAvatar'
import { InstallAppCard } from '../../components/ui/InstallAppCard'
import { RecipeVisual } from '../../components/recipes/RecipeVisual'
import { useBaby } from '../../hooks/useBaby'
import { useMealPlan } from '../../hooks/useMealPlan'
import { useState } from 'react'
import { getWeekStart, toIsoDate } from '../../utils/dates'
import { mealTypeLabels } from '../../utils/labels'

const actions = [
  {
    title: 'Usar o que tenho em casa',
    description: 'Encontre ideias a partir dos ingredientes da sua cozinha.',
    icon: Refrigerator,
    path: '/app/pantry',
  },
  {
    title: 'Ver receitas',
    description: 'Explore opções por refeição, idade e tempo de preparo.',
    icon: Salad,
    path: '/app/recipes',
  },
  {
    title: 'Lista de compras',
    description: 'Leve a semana organizada para o mercado.',
    icon: ListChecks,
    path: '/app/shopping-list',
  },
]

export function HomePage() {
  const { data: baby } = useBaby()
  const currentWeekStart = getWeekStart()
  const { data: plan } = useMealPlan(baby?.id, currentWeekStart)
  const [showInstallInvite, setShowInstallInvite] = useState(
    () => window.localStorage.getItem('pratinho-install-invite-dismissed') !== 'true',
  )
  const previewItems = plan?.meal_plan_items
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.meal_type.localeCompare(b.meal_type))
    .slice(0, 3)
  const todayIso = toIsoDate(new Date())
  const nextMeal = plan?.meal_plan_items
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.meal_type.localeCompare(b.meal_type))
    .find((item) => item.date >= todayIso) ?? previewItems?.[0]

  return (
    <div className="space-y-10">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-cream-100 bg-white px-5 py-7 shadow-[0_18px_50px_rgba(65,65,60,0.06)] sm:px-9 sm:py-10 lg:grid lg:grid-cols-[1.25fr_0.75fr] lg:gap-12 lg:px-12 lg:py-12">
        {baby && <BabyPhotoBackdrop name={baby.name} photoUrl={baby.photo_url} />}
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-sage-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-sage-700">
            {baby ? (
              <BabyAvatar className="-my-1 -ml-1" name={baby.name} photoUrl={baby.photo_url} size="sm" />
            ) : (
              <Sparkles aria-hidden="true" size={15} />
            )}
            {baby ? `Planejamento de ${baby.name}` : 'Planejamento sem complicar'}
          </div>
          <h1 className="max-w-2xl text-[36px] leading-[1.06] font-semibold tracking-[-0.045em] text-ink-900 sm:text-5xl lg:text-[56px]">
            Uma semana mais leve começa antes da próxima refeição.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-500 sm:text-lg">
            O Pratinho Pronto transforma receitas em um plano simples para você
            saber o que preparar, quando preparar e o que comprar.
          </p>
          <Link
            className="mt-7 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-pumpkin px-5 text-base font-medium text-[#2A2A22] hover:bg-pumpkin/90 sm:w-auto sm:min-w-64"
            to="/app/week"
          >
            {plan ? 'Ver minha semana' : 'Montar minha semana'}
            <ArrowRight aria-hidden="true" size={19} />
          </Link>
          <p className="mt-3 text-center text-xs text-ink-500 sm:text-left">
            Planejamento compatível com a idade e as escolhas cadastradas.
          </p>
        </div>

        <div className="relative z-10 mt-8 rounded-[24px] bg-cream-50 p-5 lg:mt-0 lg:self-center lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-terracotta-500">
                Prévia da semana
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.025em]">
                {plan ? `Semana de ${baby?.name ?? 'seu bebê'}` : 'Tudo no seu ritmo'}
              </h2>
            </div>
            <span className="grid size-11 place-items-center rounded-2xl bg-white text-sage-700 shadow-sm">
              <CalendarDays aria-hidden="true" size={21} />
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {previewItems && previewItems.length > 0
              ? previewItems.map((item) => (
                <Link
                  className="flex items-center gap-3 rounded-2xl border border-cream-100 bg-white px-3 py-2.5 transition hover:border-sage-300 focus:outline-none focus:ring-2 focus:ring-pumpkin focus:ring-offset-2"
                  key={item.id}
                  state={{ returnTo: `/app/week?week=${currentWeekStart}` }}
                  to={`/app/recipes/${item.recipe.id}`}
                >
                  <RecipeVisual imageUrl={item.recipe.image_url} name={item.recipe.name} size="thumb" />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase text-terracotta-500">
                    {mealTypeLabels[item.meal_type]}
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-medium text-ink-700">{item.recipe.name}</span>
                    <span className="mt-0.5 block text-[11px] text-sage-700">Ver como fazer →</span>
                  </span>
                </Link>
              ))
              : ['Escolha as refeições', 'Receba um plano variado', 'Gere sua lista'].map(
                  (item) => (
                    <div
                      className="flex items-center gap-3 rounded-2xl border border-cream-100 bg-white px-4 py-3.5"
                      key={item}
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sage-100 text-sage-700">
                        <Check aria-hidden="true" size={15} strokeWidth={2.4} />
                      </span>
                      <span className="text-sm font-medium text-ink-700">{item}</span>
                    </div>
                  ),
                )}
          </div>
        </div>
      </section>

      {plan && showInstallInvite && (
        <InstallAppCard
          onDismiss={() => {
            window.localStorage.setItem('pratinho-install-invite-dismissed', 'true')
            setShowInstallInvite(false)
          }}
        />
      )}

      {plan && nextMeal && (
        <section className="rounded-[24px] border border-cream-100 bg-white p-4 shadow-[0_12px_40px_rgba(65,65,60,0.04)] sm:flex sm:items-center sm:gap-5 sm:p-5" aria-labelledby="next-meal-title">
          <RecipeVisual imageUrl={nextMeal.recipe.image_url} name={nextMeal.recipe.name} size="thumb" />
          <div className="mt-3 min-w-0 sm:mt-0 sm:flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-terracotta-500">Próxima refeição</p>
            <h2 className="mt-1 text-lg font-semibold text-ink-900" id="next-meal-title">{nextMeal.recipe.name}</h2>
            <p className="mt-1 text-sm text-ink-500">{mealTypeLabels[nextMeal.meal_type]} · {nextMeal.date === todayIso ? 'para hoje' : 'na sua semana'}</p>
          </div>
          <Link
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-sage-50 px-4 text-sm font-semibold text-sage-700 transition hover:bg-sage-100 sm:mt-0 sm:w-auto"
            state={{ returnTo: `/app/week?week=${currentWeekStart}` }}
            to={`/app/recipes/${nextMeal.recipe.id}`}
          >
            Ver preparo
          </Link>
        </section>
      )}

      <section aria-labelledby="quick-actions-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-terracotta-500">Em poucos toques</p>
            <h2
              className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl"
              id="quick-actions-title"
            >
              Sua rotina, organizada
            </h2>
          </div>
          <span className="hidden items-center gap-1.5 text-sm text-ink-500 sm:flex">
            <Clock3 aria-hidden="true" size={16} />
            Feito para o celular
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {actions.map(({ title, description, icon: Icon, path }) => (
            <Link
              className="rounded-[22px] border border-cream-100 bg-white p-5 shadow-[0_10px_35px_rgba(65,65,60,0.04)]"
              key={title}
              to={path}
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-sage-50 text-sage-700">
                <Icon aria-hidden="true" size={21} strokeWidth={1.8} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-ink-500">{description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-terracotta-500">
                Abrir
                <ArrowRight aria-hidden="true" size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-cream-100 bg-sage-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white text-sage-700">
            <ShieldCheck aria-hidden="true" size={19} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-700">Acesso protegido</p>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              Sua sessão é recuperada automaticamente neste dispositivo.
            </p>
          </div>
        </div>
        <span className="mt-3 inline-flex rounded-full bg-sage-100 px-3 py-1.5 text-xs font-semibold text-sage-700 sm:mt-0">
          Sessão ativa
        </span>
      </section>

      <p className="border-t border-cream-100 pt-6 text-xs leading-5 text-ink-500 md:hidden">
        O Pratinho Pronto é uma ferramenta de organização alimentar e não
        substitui orientação individual de pediatra ou nutricionista.
      </p>
    </div>
  )
}
