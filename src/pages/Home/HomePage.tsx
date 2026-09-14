import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CirclePlay,
  Clock3,
  ExternalLink,
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
import { formatShortDate, getWeekStart, toIsoDate } from '../../utils/dates'
import { compareMealTypes, mealTypeLabels } from '../../utils/labels'
import { analytics } from '../../services/analytics'

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

const guideMaterials = [
  {
    id: 'introducao-alimentar',
    title: 'Guia de Introdução Alimentar',
    description: 'Primeiros passos, rotina, grupos alimentares e cuidados gerais.',
    cover: '/assets/bonus-introducao-cover.webp',
    href: 'https://drive.google.com/file/d/1a2_qu0WNKVxz_UZg7fOIJzaL6h1rzXaW/view?usp=sharing',
  },
  {
    id: 'rotina-do-sono',
    title: 'Guia da Rotina do Sono',
    description: 'Hábitos e orientações práticas para uma rotina mais previsível.',
    cover: '/assets/bonus-sono-cover.webp',
    href: 'https://drive.google.com/file/d/1XUNdjqyPDOI25rqXqI6wAKHCc7w-YJ9y/view?usp=sharing',
  },
  {
    id: 'cortes-e-texturas',
    title: 'Guia Visual de Cortes e Texturas',
    description: 'Referências visuais de formatos e consistências para cada fase.',
    cover: '/assets/bonus-cortes-texturas-cover.webp',
    href: 'https://drive.google.com/file/d/11ieTNjnxRmNnux6gBYXXd9gKWWnGrfFc/view?usp=sharing',
  },
]

const videoMaterials = [
  {
    id: 'choconildo',
    title: 'Choconildo de banana e cacau',
    description: 'Uma opção cremosa preparada com banana madura e cacau.',
    poster: '/assets/video-lessons/choconildo-poster.webp',
    src: '/assets/video-lessons/choconildo.mp4',
  },
  {
    id: 'danoninho-uva',
    title: 'Danoninho de uva e banana',
    description: 'Preparo rápido com textura cremosa e poucos ingredientes.',
    poster: '/assets/video-lessons/danoninho-uva-poster.webp',
    src: '/assets/video-lessons/danoninho-uva.mp4',
  },
  {
    id: 'creme-abacate',
    title: 'Creme de abacate com banana',
    description: 'Receita prática para chegar a uma consistência bem cremosa.',
    poster: '/assets/video-lessons/creme-abacate-poster.webp',
    src: '/assets/video-lessons/creme-abacate.mp4',
  },
]

export function HomePage() {
  const { data: baby } = useBaby()
  const currentWeekStart = getWeekStart()
  const { data: plan, isLoading: planLoading } = useMealPlan(baby?.id, currentWeekStart)
  const [showInstallInvite, setShowInstallInvite] = useState(
    () => window.localStorage.getItem('pratinho-install-invite-dismissed') !== 'true',
  )
  const todayIso = toIsoDate(new Date())
  const sortedItems = plan?.meal_plan_items
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || compareMealTypes(a.meal_type, b.meal_type))
  // Mostramos o que ainda vem: refeições de dias passados não ajudam hoje.
  const upcomingItems = sortedItems?.filter((item) => item.date >= todayIso)
  const previewItems = (upcomingItems?.length ? upcomingItems : sortedItems)?.slice(0, 3)
  const nextMeal = previewItems?.[0]
  const todayItems = sortedItems?.filter((item) => item.date === todayIso) ?? []

  return (
    <div className="space-y-10">
      {/* Próxima refeição: primeira coisa útil quando a semana já existe. */}
      {plan && nextMeal ? (
        <section
          aria-labelledby="next-meal-title"
          className="pp-panel pp-lifted overflow-hidden sm:grid sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
        >
          <RecipeVisual
            imageUrl={nextMeal.recipe.image_url}
            name={nextMeal.recipe.name}
            priority
            size="square"
          />
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              {baby && (
                <BabyAvatar name={baby.name} photoUrl={baby.photo_url} size="sm" />
              )}
              <span className="pp-badge pp-badge-terracotta">
                {mealTypeLabels[nextMeal.meal_type]}
              </span>
              {nextMeal.date === todayIso ? (
                <span className="pp-badge pp-badge-today">Hoje</span>
              ) : (
                <span className="pp-badge pp-badge-sage">{formatShortDate(nextMeal.date)}</span>
              )}
            </div>
            <p className="pp-eyebrow mt-4">Próxima refeição</p>
            <h1
              className="mt-2 text-[28px] leading-[1.12] break-words text-ink-900 sm:text-[34px]"
              id="next-meal-title"
            >
              {nextMeal.recipe.name}
            </h1>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-500">
              <Clock3 aria-hidden="true" size={15} />
              {nextMeal.recipe.prep_time_minutes} min de preparo
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                className="pp-btn pp-btn-primary pp-btn-lg flex-1"
                state={{ returnTo: `/app/week?week=${currentWeekStart}` }}
                to={`/app/recipes/${nextMeal.recipe.id}`}
              >
                Ver como preparar
              </Link>
              <Link
                className="pp-btn pp-btn-secondary sm:w-auto"
                to={`/app/week?week=${currentWeekStart}`}
              >
                <CalendarDays aria-hidden="true" size={17} />
                Minha semana
              </Link>
            </div>
            {todayItems.length > 0 && (
              <p className="mt-3 text-xs text-ink-500">
                {todayItems.length}{' '}
                {todayItems.length === 1 ? 'refeição planejada hoje' : 'refeições planejadas hoje'}
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className="pp-panel pp-lifted relative isolate overflow-hidden px-5 py-8 sm:px-9 sm:py-10 lg:grid lg:grid-cols-[1.25fr_0.75fr] lg:gap-12 lg:px-12 lg:py-12">
          {baby && <BabyPhotoBackdrop name={baby.name} photoUrl={baby.photo_url} />}
          <div className="relative z-10">
            <div className="pp-badge pp-badge-sage mb-5 tracking-[0.1em] uppercase">
              {baby ? (
                <BabyAvatar className="-my-1 -ml-1" name={baby.name} photoUrl={baby.photo_url} size="sm" />
              ) : (
                <Sparkles aria-hidden="true" size={15} />
              )}
              {baby ? `Planejamento de ${baby.name}` : 'Planejamento sem complicar'}
            </div>
            <h1 className="max-w-2xl text-[32px] leading-[1.06] text-ink-900 sm:text-5xl lg:text-[52px]">
              Uma semana mais leve começa antes da próxima refeição.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-500 sm:text-lg">
              O Pratinho Pronto transforma receitas em um plano simples para você
              saber o que preparar, quando preparar e o que comprar.
            </p>
            <Link
              className="pp-btn pp-btn-primary pp-btn-lg mt-7 w-full sm:w-auto sm:min-w-64"
              to={`/app/week?week=${currentWeekStart}`}
            >
              {plan ? 'Ver minha semana' : 'Montar minha semana'}
              <ArrowRight aria-hidden="true" size={19} />
            </Link>
            <p className="mt-3 text-center text-xs text-ink-500 sm:text-left">
              Planejamento compatível com a idade e as escolhas cadastradas.
            </p>
          </div>

          <div className="pp-panel-quiet relative z-10 mt-8 p-5 lg:mt-0 lg:self-center lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="pp-eyebrow">{plan ? 'Seu cardápio desta semana' : 'Como funciona'}</p>
                <h2 className="mt-1.5 text-xl text-ink-900">
                  {plan ? `Semana de ${baby?.name ?? 'seu bebê'}` : 'Tudo no seu ritmo'}
                </h2>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-white text-sage-700 shadow-sm">
                <CalendarDays aria-hidden="true" size={21} />
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {planLoading
                ? ['a', 'b', 'c'].map((placeholder) => (
                    <div className="pp-skeleton h-16" key={placeholder} />
                  ))
                : previewItems && previewItems.length > 0
                  ? previewItems.map((item) => (
                      <Link
                        className="pp-card pp-interactive flex items-center gap-3 p-2.5"
                        key={item.id}
                        state={{ returnTo: `/app/week?week=${currentWeekStart}` }}
                        to={`/app/recipes/${item.recipe.id}`}
                      >
                        <RecipeVisual
                          imageUrl={item.recipe.image_url}
                          name={item.recipe.name}
                          size="thumb-sm"
                        />
                        <span className="min-w-0">
                          <span className="block text-[10px] font-bold tracking-[0.06em] text-terracotta-500 uppercase">
                            {mealTypeLabels[item.meal_type]}
                            {item.date === todayIso ? ' · hoje' : ''}
                          </span>
                          <span className="mt-0.5 block truncate text-sm font-medium text-ink-700">
                            {item.recipe.name}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-sage-700">
                            Ver como preparar →
                          </span>
                        </span>
                      </Link>
                    ))
                  : ['Escolha as refeições', 'Receba um plano variado', 'Gere sua lista'].map(
                      (item) => (
                        <div className="pp-card flex items-center gap-3 px-4 py-3.5" key={item}>
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
      )}

      {plan && showInstallInvite && (
        <InstallAppCard
          onDismiss={() => {
            window.localStorage.setItem('pratinho-install-invite-dismissed', 'true')
            setShowInstallInvite(false)
          }}
        />
      )}

      {plan && previewItems && previewItems.length > 1 && (
        <section aria-labelledby="upcoming-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="pp-eyebrow">Ainda nesta semana</p>
              <h2 className="mt-1.5 text-2xl text-ink-900 sm:text-3xl" id="upcoming-title">
                O que vem depois
              </h2>
            </div>
            <Link className="pp-link hidden text-sm sm:inline-flex" to={`/app/week?week=${currentWeekStart}`}>
              Ver a semana
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {previewItems.slice(1).map((item) => (
              <li key={item.id}>
                <Link
                  className="pp-card pp-interactive flex items-center gap-3 p-3"
                  state={{ returnTo: `/app/week?week=${currentWeekStart}` }}
                  to={`/app/recipes/${item.recipe.id}`}
                >
                  <RecipeVisual
                    imageUrl={item.recipe.image_url}
                    name={item.recipe.name}
                    size="thumb"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold tracking-[0.06em] text-terracotta-500 uppercase">
                      {mealTypeLabels[item.meal_type]}
                      {item.date === todayIso ? ' · hoje' : ` · ${formatShortDate(item.date)}`}
                    </span>
                    <span className="mt-0.5 block text-sm font-medium break-words text-ink-900">
                      {item.recipe.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-sage-700">
                      Ver como preparar →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="quick-actions-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="pp-eyebrow">Em poucos toques</p>
            <h2 className="mt-1.5 text-2xl text-ink-900 sm:text-3xl" id="quick-actions-title">
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
              className="pp-card pp-interactive p-5"
              key={title}
              to={path === '/app/shopping-list' ? `${path}?week=${currentWeekStart}` : path}
            >
              <span className="grid size-11 place-items-center rounded-[14px] bg-sage-50 text-sage-700">
                <Icon aria-hidden="true" size={21} strokeWidth={1.8} />
              </span>
              <h3 className="mt-4 text-base text-ink-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-ink-500">{description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-terracotta-500">
                Abrir
                <ArrowRight aria-hidden="true" size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="materials-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="pp-eyebrow">Incluídos no seu acesso</p>
            <h2 className="mt-1.5 text-2xl text-ink-900 sm:text-3xl" id="materials-title">
              Meus materiais
            </h2>
          </div>
          <span className="hidden items-center gap-1.5 text-sm text-ink-500 sm:flex">
            <BookOpen aria-hidden="true" size={17} />
            Consulte quando precisar
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {guideMaterials.map((guide) => (
            <article className="pp-card flex flex-col overflow-hidden" key={guide.id}>
              <div className="aspect-[4/3] overflow-hidden bg-cream-50">
                <img
                  alt={`Capa do ${guide.title}`}
                  className="h-full w-full object-cover object-top"
                  height="360"
                  loading="lazy"
                  src={guide.cover}
                  width="480"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg leading-snug text-ink-900">{guide.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{guide.description}</p>
                <a
                  className="pp-btn pp-btn-quiet mt-auto w-full"
                  href={guide.href}
                  onClick={() => analytics.track('material_opened', { material: guide.id })}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Abrir guia
                  <ExternalLink aria-hidden="true" size={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="video-materials-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="pp-eyebrow">Bônus premium</p>
            <h2 className="mt-1.5 text-2xl text-ink-900 sm:text-3xl" id="video-materials-title">
              Receitas em vídeo
            </h2>
          </div>
          <span className="hidden items-center gap-1.5 text-sm text-ink-500 sm:flex">
            <CirclePlay aria-hidden="true" size={17} />
            Assista quando quiser
          </span>
        </div>

        <div className="pp-scroller flex snap-x snap-mandatory gap-4 pb-3 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {videoMaterials.map((video) => (
            <article
              className="pp-card min-w-[82%] snap-center overflow-hidden sm:min-w-[48%] md:min-w-0"
              key={video.id}
            >
              <div className="aspect-[9/16] overflow-hidden bg-ink-900">
                <video
                  className="h-full w-full object-cover"
                  controls
                  onPlay={() => analytics.track('material_opened', { material: `video-${video.id}` })}
                  playsInline
                  poster={video.poster}
                  preload="metadata"
                >
                  <source src={video.src} type="video/mp4" />
                  Seu navegador não suporta a reprodução deste vídeo.
                </video>
              </div>
              <div className="p-5">
                <h3 className="text-lg leading-snug text-ink-900">{video.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{video.description}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-500 md:hidden">Deslize para o lado para ver os três vídeos.</p>
      </section>

      <section className="pp-panel-quiet p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-sage-50 text-sage-700">
            <ShieldCheck aria-hidden="true" size={19} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-700">Acesso protegido</p>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              Sua sessão é recuperada automaticamente neste dispositivo.
            </p>
          </div>
        </div>
        <span className="pp-badge pp-badge-sage mt-3 sm:mt-0">Sessão ativa</span>
      </section>

      <p className="border-t border-cream-100 pt-6 text-xs leading-5 text-ink-500 md:hidden">
        O Pratinho Pronto é uma ferramenta de organização alimentar e não
        substitui orientação individual de pediatra ou nutricionista.
      </p>
    </div>
  )
}
