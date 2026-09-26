import { ArrowRight, BookOpen, CalendarDays, ChevronRight, CirclePlay, Clock3, ExternalLink, Heart, ListChecks, Refrigerator, Search, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { BabyAvatar } from '../../components/baby/BabyAvatar'
import { InstallAppCard } from '../../components/ui/InstallAppCard'
import { PageState } from '../../components/ui/PageState'
import { RecipeVisual } from '../../components/recipes/RecipeVisual'
import { useBaby } from '../../hooks/useBaby'
import { useMealPlan } from '../../hooks/useMealPlan'
import { calculateAgeMonths, formatShortDate, getWeekStart, toIsoDate } from '../../utils/dates'
import { compareMealTypes, mealTypeLabels } from '../../utils/labels'
import { analytics } from '../../services/analytics'

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
  const [showInstallInvite, setShowInstallInvite] = useState(() => {
    try { return window.localStorage.getItem('pratinho-install-invite-dismissed') !== 'true' }
    catch { return false }
  })
  const todayIso = toIsoDate(new Date())
  const sortedItems = [...(plan?.meal_plan_items ?? [])].sort((a, b) => a.date.localeCompare(b.date) || compareMealTypes(a.meal_type, b.meal_type))
  const todayItems = sortedItems.filter((item) => item.date === todayIso)
  const upcomingItems = sortedItems.filter((item) => item.date >= todayIso)
  const nextMeal = upcomingItems[0]
  const furtherMeals = upcomingItems.slice(1, 4)
  const weekLink = `/app/week?week=${currentWeekStart}`

  return (
    <div className="pp-home">
      <header className="pp-home-greeting">
        <div>
          <p className="pp-eyebrow">Um cuidado de cada vez</p>
          <h1 className="pp-page-title">Pequenas refeições. Grandes descobertas.</h1>
          <p className="pp-page-description">Ideias para {baby?.name ?? 'seu bebê'}. Mais leveza para você.</p>
        </div>
        {baby && (
          <Link className="pp-baby-pill" to="/app/profile" aria-label={`Ver perfil de ${baby.name}`}>
            <BabyAvatar name={baby.name} photoUrl={baby.photo_url} size="sm" />
            <span><strong>{baby.name}</strong><small>{calculateAgeMonths(baby.birth_date)} meses</small></span>
            <ChevronRight aria-hidden="true" size={16} />
          </Link>
        )}
      </header>

      <Link className="pp-home-search" to="/app/recipes">
        <Search aria-hidden="true" size={20} /><span>O que vamos preparar hoje?</span><span className="pp-search-arrow"><ArrowRight aria-hidden="true" size={18} /></span>
      </Link>

      <div className="pp-home-primary">
        <section aria-labelledby="today-heading" className="pp-today">
          <div className="pp-section-heading"><div><p className="pp-eyebrow">No seu ritmo</p><h2 id="today-heading">Seu pratinho de hoje</h2></div><CalendarDays aria-hidden="true" size={22} /></div>
          {planLoading ? (
            <div className="pp-loading-meal" role="status" aria-busy="true"><div className="pp-skeleton h-36" /><p>Carregando seu cardápio…</p></div>
          ) : planError ? (
            <PageState variant="error" title="Vamos tentar de novo?" description="Seu cardápio não carregou. As receitas continuam a um toque." action={<button className="pp-btn pp-btn-primary" onClick={() => void refetch()} type="button">Tentar novamente</button>} />
          ) : nextMeal ? (
            <article className="pp-feature-meal">
              <Link to={`/app/recipes/${nextMeal.recipe.id}`} state={{ returnTo: '/app' }} aria-label={`Preparar ${nextMeal.recipe.name}`} className="pp-feature-image">
                <RecipeVisual imageUrl={nextMeal.recipe.image_url} name={nextMeal.recipe.name} priority size="square" />
                <span className="pp-feature-date">{nextMeal.date === todayIso ? 'No cardápio de hoje' : formatShortDate(nextMeal.date)}</span>
              </Link>
              <div className="pp-feature-copy">
                <span className="pp-meal-label">{mealTypeLabels[nextMeal.meal_type]}</span>
                <h3>{nextMeal.recipe.name}</h3>
                <div className="pp-meal-meta"><span><Clock3 aria-hidden="true" size={16} />{nextMeal.recipe.prep_time_minutes} min</span><span>{nextMeal.recipe.min_age_months}+ meses</span></div>
                <Link className="pp-btn pp-btn-primary pp-btn-lg" to={`/app/recipes/${nextMeal.recipe.id}`} state={{ returnTo: '/app' }}>Vamos preparar<ArrowRight aria-hidden="true" size={18} /></Link>
                {nextMeal.recipe.is_demo && <small className="pp-demo-note">Receita demonstrativa do catálogo</small>}
              </div>
            </article>
          ) : (
            <div className="pp-first-week">
              <span className="pp-first-week-icon"><Sprout aria-hidden="true" size={32} strokeWidth={1.5} /></span>
              <h3>{plan ? 'Um novo dia, novas ideias.' : 'Menos “o que fazer?”. Mais tempo juntos.'}</h3>
              <p>{plan ? 'Explore as receitas ou organize a próxima semana no seu ritmo.' : 'Monte um cardápio com as preferências cadastradas do seu bebê. A lista de compras vem junto.'}</p>
              <Link className="pp-btn pp-btn-primary pp-btn-lg" to={weekLink}>{plan ? 'Organizar minha semana' : 'Montar minha semana'}<ArrowRight aria-hidden="true" size={18} /></Link>
            </div>
          )}
          {plan && !planLoading && !planError && <Link className="pp-today-footer" to={weekLink}><span><CalendarDays aria-hidden="true" size={17} />{todayItems.length > 0 ? `${todayItems.length} refeições no cardápio de hoje` : 'Seu planejamento semanal'}</span><ChevronRight aria-hidden="true" size={18} /></Link>}
        </section>

        <aside className="pp-routine" aria-label="Atalhos da sua rotina">
          <Link to="/app/pantry" className="pp-pantry-invite"><Refrigerator aria-hidden="true" size={26} strokeWidth={1.6} /><div><span className="pp-eyebrow">Na sua cozinha</span><h2>Tem aí? Vira pratinho.</h2><p>Encontre ideias com os ingredientes que você já tem.</p></div><span className="pp-inline-action">Abrir minha despensa<ArrowRight aria-hidden="true" size={18} /></span></Link>
          <Link className="pp-shortcut" to={`/app/shopping-list?week=${currentWeekStart}`}><span className="pp-shortcut-icon"><ListChecks aria-hidden="true" size={23} /></span><span><strong>Lista de compras</strong><small>Do planejamento para o mercado</small></span><ChevronRight aria-hidden="true" size={19} /></Link>
          <Link className="pp-shortcut" to="/app/recipes?favorites=true"><span className="pp-shortcut-icon pp-shortcut-rose"><Heart aria-hidden="true" size={22} /></span><span><strong>Receitas favoritas</strong><small>Para fazer de novo, sem procurar</small></span><ChevronRight aria-hidden="true" size={19} /></Link>
        </aside>
      </div>

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
