import { ArrowRight, BookOpen, CalendarDays, ChevronRight, CirclePlay, Clock3, ExternalLink, Heart, ListChecks, Refrigerator, Search, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { BabyAvatar } from '../../components/baby/BabyAvatar'
import { InstallAppCard } from '../../components/ui/InstallAppCard'
import { PageState } from '../../components/ui/PageState'
import { RecipeVisual } from '../../components/recipes/RecipeVisual'
import { useBaby } from '../../hooks/useBaby'
import { useMealPlan } from '../../hooks/useMealPlan'
import { useShoppingList } from '../../hooks/useShoppingList'
import { addDays, calculateAgeMonths, formatShortDate, getWeekStart, toIsoDate } from '../../utils/dates'
import { compareMealTypes, mealTypeLabels, weekDayLabels } from '../../utils/labels'
import { analytics } from '../../services/analytics'
import { shouldShowDemoBadge } from '../../lib/recipes/content-status'

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
  const { data: plan, isLoading: planLoading, error: planError, refetch } = useMealPlan(baby?.id, currentWeekStart)
  const { data: shoppingList } = useShoppingList(plan?.id)
  const [showInstallInvite, setShowInstallInvite] = useState(() => {
    try { return window.localStorage.getItem('pratinho-install-invite-dismissed') !== 'true' }
    catch { return false }
  })
  const todayIso = toIsoDate(new Date())
  const sortedItems = [...(plan?.meal_plan_items ?? [])].sort((a, b) => a.date.localeCompare(b.date) || compareMealTypes(a.meal_type, b.meal_type))
  const upcomingItems = sortedItems.filter((item) => item.date >= todayIso)
  const nextMeal = upcomingItems[0]
  const furtherMeals = upcomingItems.slice(1, 4)
  const weekLink = `/app/week?week=${currentWeekStart}`
  const shoppingLink = `/app/shopping-list?week=${currentWeekStart}`

  // Resumo real da semana (sem dados inventados): refeições planejadas e dias
  // cobertos, além do progresso da lista de compras quando ela já existe.
  const weekMeals = sortedItems.length
  const daysCovered = new Set(sortedItems.map((item) => item.date)).size
  const shoppingItems = shoppingList?.shopping_list_items ?? []
  const shoppingChecked = shoppingItems.filter((item) => item.checked).length
  const hasWeekSummary = Boolean(plan) && weekMeals > 0

  // Ritmo da semana: um dia só aparece "coberto" se tiver refeição de verdade.
  const weekDates = weekDayLabels.map((_, index) => addDays(currentWeekStart, index))
  const weekRangeLabel = `${formatShortDate(currentWeekStart)} – ${formatShortDate(addDays(currentWeekStart, 6))}`

  return (
    <div className="pp-home">
      {/* HERO editorial. No desktop, composição assimétrica: texto + detalhe à
          esquerda, fotografia à direita. No mobile, a ordem é texto → FOTO →
          detalhe, para a comida aparecer na primeira dobra em vez de ficar
          abaixo de título, botões e meta. */}
      <section aria-labelledby="home-title" className="pp-hero">
        <div className="pp-hero-copy">
          <p className="pp-eyebrow">Sua semana · {weekRangeLabel}</p>
          <h1 className="pp-page-title" id="home-title">Pequenas refeições. Grandes descobertas.</h1>
          <p className="pp-hero-lead">
            Ideias para {baby?.name ?? 'seu bebê'}. Mais leveza para você.
          </p>
          {baby && (
            <Link className="pp-baby-pill pp-hero-baby" to="/app/profile" aria-label={`Ver perfil de ${baby.name}`}>
              <BabyAvatar name={baby.name} photoUrl={baby.photo_url} size="sm" />
              <span><strong>{baby.name}</strong><small>{calculateAgeMonths(baby.birth_date)} meses</small></span>
              <ChevronRight aria-hidden="true" size={16} />
            </Link>
          )}
        </div>

        <div className="pp-hero-media">
          {nextMeal ? (
            <Link aria-label={`Preparar ${nextMeal.recipe.name}`} className="pp-hero-photo" state={{ returnTo: '/app' }} to={`/app/recipes/${nextMeal.recipe.id}`}>
              <RecipeVisual imageUrl={nextMeal.recipe.image_url} name={nextMeal.recipe.name} priority size="hero" />
              {/* Legenda só com o contexto do horário: o nome do prato aparece
                  uma única vez, no bloco de detalhe, para não repetir. */}
              <span className="pp-hero-photo-caption">
                <span className="pp-hero-photo-label">{mealTypeLabels[nextMeal.meal_type]}</span>
                <span className="pp-hero-photo-when">{nextMeal.date === todayIso ? 'No cardápio de hoje' : formatShortDate(nextMeal.date)}</span>
              </span>
            </Link>
          ) : (
            <Link className="pp-hero-search-tile" to="/app/recipes">
              <Search aria-hidden="true" size={22} />
              <span>O que vamos preparar hoje?</span>
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          )}
        </div>

        <div className="pp-hero-detail">
          {planLoading ? (
            <div className="pp-hero-meal pp-loading-meal" role="status" aria-busy="true">
              <div className="pp-skeleton h-24" />
              <p>Carregando seu cardápio…</p>
            </div>
          ) : planError ? (
            <PageState
              action={<button className="pp-btn pp-btn-primary" onClick={() => void refetch()} type="button">Tentar novamente</button>}
              description="Seu cardápio não carregou. As receitas continuam a um toque."
              title="Vamos tentar de novo?"
              variant="error"
            />
          ) : nextMeal ? (
            <div className="pp-hero-meal">
              <span className="pp-hero-meal-kicker">
                <span className="pp-meal-label">{mealTypeLabels[nextMeal.meal_type]}</span>
                <span className="pp-hero-meal-when">{nextMeal.date === todayIso ? 'No cardápio de hoje' : formatShortDate(nextMeal.date)}</span>
              </span>
              <h2 className="pp-hero-meal-title">{nextMeal.recipe.name}</h2>
              <div className="pp-meal-meta">
                <span><Clock3 aria-hidden="true" size={15} />{nextMeal.recipe.prep_time_minutes} min</span>
                <span>{nextMeal.recipe.min_age_months}+ meses</span>
              </div>
              <div className="pp-hero-actions">
                <Link className="pp-btn pp-btn-primary pp-btn-lg" state={{ returnTo: '/app' }} to={`/app/recipes/${nextMeal.recipe.id}`}>
                  Vamos preparar<ArrowRight aria-hidden="true" size={18} />
                </Link>
                <Link className="pp-btn pp-btn-secondary pp-btn-lg" to={weekLink}>
                  <CalendarDays aria-hidden="true" size={17} />Ver semana
                </Link>
              </div>
              {shouldShowDemoBadge(nextMeal.recipe.is_demo) && <small className="pp-demo-note">Receita demonstrativa do catálogo</small>}
            </div>
          ) : (
            <div className="pp-hero-meal pp-hero-empty">
              <h2 className="pp-hero-meal-title">{plan ? 'Um novo dia, novas ideias.' : 'Menos “o que fazer?”. Mais tempo juntos.'}</h2>
              <p>
                {plan
                  ? 'Explore as receitas ou organize a próxima semana no seu ritmo.'
                  : 'Monte um cardápio com as preferências cadastradas do seu bebê. A lista de compras vem junto.'}
              </p>
              <div className="pp-hero-actions">
                <Link className="pp-btn pp-btn-primary pp-btn-lg" to={weekLink}>
                  {plan ? 'Organizar minha semana' : 'Montar minha semana'}<ArrowRight aria-hidden="true" size={18} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Resumo integrado: uma barra segmentada, não três cartões soltos. */}
      {hasWeekSummary && !planError && (
        <section aria-label="Resumo da semana" className="pp-stat-strip" role="region">
          <Link className="pp-stat" to={weekLink}>
            <span className="pp-stat-value">{weekMeals}</span>
            <span className="pp-stat-label">{weekMeals === 1 ? 'refeição planejada' : 'refeições planejadas'}</span>
          </Link>
          <span aria-hidden="true" className="pp-stat-divider" />
          <Link className="pp-stat" to={weekLink}>
            <span className="pp-stat-value">{daysCovered}<small>/7</small></span>
            <span className="pp-stat-label">{daysCovered === 1 ? 'dia com refeição' : 'dias com refeição'}</span>
          </Link>
          <span aria-hidden="true" className="pp-stat-divider" />
          <Link className="pp-stat" to={shoppingLink}>
            {shoppingItems.length > 0 ? (
              <>
                <span className="pp-stat-value">{shoppingChecked}<small>/{shoppingItems.length}</small></span>
                <span className="pp-stat-label">itens comprados</span>
              </>
            ) : (
              <>
                <span className="pp-stat-value pp-stat-value-quiet">—</span>
                <span className="pp-stat-label">Montar lista de compras</span>
              </>
            )}
          </Link>
        </section>
      )}

      {/* Ritmo da semana: os sete dias, visualmente, sem virar uma grade de caixas. */}
      {hasWeekSummary && !planError && (
        <section aria-labelledby="rhythm-title" className="pp-rhythm">
          <div className="pp-rhythm-head">
            <h2 id="rhythm-title">O ritmo da semana</h2>
            <Link className="pp-text-action" to={weekLink}>Abrir planejamento<ArrowRight aria-hidden="true" size={15} /></Link>
          </div>
          <ul className="pp-rhythm-days">
            {weekDates.map((date, index) => {
              const count = sortedItems.filter((item) => item.date === date).length
              const isToday = date === todayIso
              return (
                <li key={date}>
                  <Link
                    aria-label={`${weekDayLabels[index]}, ${formatShortDate(date)}${isToday ? ', hoje' : ''}, ${count} refeições`}
                    className="pp-rhythm-day"
                    data-filled={count > 0 ? 'true' : 'false'}
                    data-today={isToday ? 'true' : undefined}
                    to={`${weekLink}&day=${date}`}
                  >
                    <span className="pp-rhythm-day-name">{weekDayLabels[index]}</span>
                    <span aria-hidden="true" className="pp-rhythm-day-dot" />
                    <span className="pp-rhythm-day-count">{count > 0 ? `${count} refeições` : 'livre'}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Apoio à rotina: três ações compactas, sem disputar o foco da comida. */}
      <section aria-labelledby="support-title" className="pp-support">
        <h2 className="sr-only" id="support-title">Atalhos da sua rotina</h2>
        <Link className="pp-support-card pp-support-pantry" to="/app/pantry">
          <span className="pp-support-icon"><Refrigerator aria-hidden="true" size={22} strokeWidth={1.7} /></span>
          <span className="pp-support-copy">
            <strong>Tem aí? Vira pratinho.</strong>
            <small>Ideias com o que já está na sua cozinha</small>
          </span>
          <ArrowRight aria-hidden="true" className="pp-support-arrow" size={18} />
        </Link>
        <Link className="pp-support-card" to={`/app/shopping-list?week=${currentWeekStart}`}>
          <span className="pp-support-icon"><ListChecks aria-hidden="true" size={22} strokeWidth={1.7} /></span>
          <span className="pp-support-copy">
            <strong>Lista de compras</strong>
            <small>Do planejamento para o mercado</small>
          </span>
          <ArrowRight aria-hidden="true" className="pp-support-arrow" size={18} />
        </Link>
        <Link className="pp-support-card" to="/app/recipes?favorites=true">
          <span className="pp-support-icon pp-support-icon-rose"><Heart aria-hidden="true" size={21} strokeWidth={1.7} /></span>
          <span className="pp-support-copy">
            <strong>Receitas favoritas</strong>
            <small>Para fazer de novo, sem procurar</small>
          </span>
          <ArrowRight aria-hidden="true" className="pp-support-arrow" size={18} />
        </Link>
      </section>

      {furtherMeals.length > 0 && !planError && (
        <section aria-labelledby="upcoming-title">
          <div className="pp-section-heading"><div><p className="pp-eyebrow">Um pouco de organização</p><h2 id="upcoming-title">Depois, tem mais carinho</h2></div><Link className="pp-text-action" to={weekLink}>Ver semana<ArrowRight aria-hidden="true" size={16} /></Link></div>
          <div className="pp-upcoming-grid">{furtherMeals.map((item) => <Link className="pp-upcoming-card" key={item.id} to={`/app/recipes/${item.recipe.id}`} state={{ returnTo: '/app' }}><RecipeVisual imageUrl={item.recipe.image_url} name={item.recipe.name} size="thumb" /><span><small>{mealTypeLabels[item.meal_type]} · {item.date === todayIso ? 'hoje' : formatShortDate(item.date)}</small><strong>{item.recipe.name}</strong><span className="pp-meal-meta"><Clock3 aria-hidden="true" size={14} />{item.recipe.prep_time_minutes} min</span></span></Link>)}</div>
        </section>
      )}

      <section aria-labelledby="materials-title">
        <div className="pp-section-heading"><div><p className="pp-eyebrow">Para acompanhar vocês</p><h2 id="materials-title">Uma mãozinha na rotina</h2></div><BookOpen aria-hidden="true" size={22} /></div>
        <div className="pp-guide-grid">{guideMaterials.map((guide) => <a className="pp-guide" href={guide.href} key={guide.id} target="_blank" rel="noopener noreferrer" onClick={() => analytics.track('material_opened', { material: guide.id })}><img src={guide.cover} alt="" width="90" height="112" loading="lazy" /><span><small>GUIA DIGITAL</small><h3>{guide.title}</h3><p>{guide.description}</p><span className="pp-inline-action">Abrir guia<ExternalLink aria-hidden="true" size={14} /></span></span></a>)}</div>
      </section>

      <section aria-labelledby="video-materials-title">
        <div className="pp-section-heading"><div><p className="pp-eyebrow">Veja o preparo</p><h2 id="video-materials-title">Da cozinha para a tela</h2></div><CirclePlay aria-hidden="true" size={24} /></div>
        <div className="pp-video-grid">{videoMaterials.map((video) => <article className="pp-video-card" key={video.id}><video aria-label={`Vídeo: ${video.title}`} controls playsInline preload="none" poster={video.poster} onPlay={() => analytics.track('material_opened', { material: `video-${video.id}` })}><source src={video.src} type="video/mp4" />Seu navegador não suporta este vídeo.</video><div><h3>{video.title}</h3><p>{video.description}</p></div></article>)}</div>
      </section>

      {plan && showInstallInvite && <InstallAppCard onDismiss={() => { try { window.localStorage.setItem('pratinho-install-invite-dismissed', 'true') } catch { /* A preferência é opcional. */ } setShowInstallInvite(false) }} />}
      <p className="pp-care-note"><Sprout aria-hidden="true" size={18} />Cada bebê tem seu tempo. Use o planejamento junto à orientação do pediatra ou nutricionista.</p>
    </div>
  )
}
