import { useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListChecks,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { ReplaceMealDialog } from '../../components/meal-plan/ReplaceMealDialog'
import { BabyAvatar } from '../../components/baby/BabyAvatar'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { RecipeVisual } from '../../components/recipes/RecipeVisual'
import { PageState } from '../../components/ui/PageState'
import { useBaby } from '../../hooks/useBaby'
import { mealPlanQueryKey, useMealPlan } from '../../hooks/useMealPlan'
import { mealPlanHistoryQueryKey, useMealPlanHistory } from '../../hooks/useMealPlanHistory'
import { useRecipes } from '../../hooks/useRecipes'
import {
  generateWeeklyMealPlan,
  getCompatibleRecipes,
} from '../../lib/meal-plan/generator'
import { analytics } from '../../services/analytics'
import { duplicateMealPlan, replaceMealPlanItem, saveMealPlan } from '../../services/mealPlans'
import type { MealPlanItem, MealType, Recipe } from '../../types/domain'
import {
  addDays,
  formatShortDate,
  getWeekStart,
  normalizeWeekStart,
  parseIsoDate,
  toIsoDate,
} from '../../utils/dates'
import { compareMealTypes, mealTypeLabels, weekDayLabels } from '../../utils/labels'

const allMealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']

export function MealPlanPage() {
  const queryClient = useQueryClient()
  const { data: baby } = useBaby()
  const { data: recipes = [], error: recipesError, isLoading: recipesLoading } = useRecipes()
  const [searchParams, setSearchParams] = useSearchParams()
  // A URL é a fonte da verdade da semana: assim os links do histórico e o
  // botão voltar do navegador sempre abrem a semana correta.
  const weekStart = normalizeWeekStart(searchParams.get('week'))
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>(allMealTypes)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [replacingItem, setReplacingItem] = useState<MealPlanItem | null>(null)
  const [isReplacing, setIsReplacing] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  // Dia aberto no destaque. Acompanha a semana exibida: se a semana muda, a
  // seleção anterior deixa de valer e voltamos ao primeiro dia relevante.
  const [daySelection, setDaySelection] = useState<{ date: string; week: string } | null>(null)
  const { data: plan, error: planError, isLoading: planLoading } = useMealPlan(
    baby?.id,
    weekStart,
  )
  const { data: history = [] } = useMealPlanHistory(baby?.id)
  const todayIso = toIsoDate(new Date())
  const thisWeekStart = getWeekStart()

  function goToWeek(nextWeekStart: string) {
    setStatusMessage(null)
    setSearchParams({ week: normalizeWeekStart(nextWeekStart) }, { replace: true })
  }

  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, MealPlanItem[]>()
    plan?.meal_plan_items
      .slice()
      .sort((a, b) => compareMealTypes(a.meal_type, b.meal_type) || a.position - b.position)
      .forEach((item) => {
        grouped.set(item.date, [...(grouped.get(item.date) ?? []), item])
      })
    return grouped
  }, [plan])

  const alternatives = useMemo(() => {
    if (!baby || !replacingItem) return []
    return getCompatibleRecipes(
      baby,
      recipes,
      replacingItem.meal_type,
      parseIsoDate(replacingItem.date),
      replacingItem.recipe_id,
    ).slice(0, 5)
  }, [baby, recipes, replacingItem])

  if (!baby || recipesLoading) {
    return <PageState description="Preparando receitas e preferências." title="Montando a base da semana…" />
  }

  if (recipesError || planError) {
    return (
      <PageState
        action={
          <button className="pp-btn pp-btn-primary" onClick={() => window.location.reload()} type="button">
            Tentar de novo
          </button>
        }
        description="A conexão falhou ao buscar seu cardápio. Verifique a internet e tente novamente."
        title="Não conseguimos abrir esta semana"
        variant="error"
      />
    )
  }

  const currentBaby = baby
  // Dia em destaque: o dia selecionado, ou hoje quando a semana exibida é a
  // atual, ou a segunda-feira da semana visitada.
  const weekDates = weekDayLabels.map((_, index) => addDays(weekStart, index))
  const defaultDate = weekDates.includes(todayIso) ? todayIso : weekStart
  const selectedDate =
    daySelection && daySelection.week === weekStart ? daySelection.date : defaultDate
  const selectedDayIndex = Math.max(0, weekDates.indexOf(selectedDate))
  const selectedDayItems = itemsByDate.get(selectedDate) ?? []
  const [featuredItem, ...otherItems] = selectedDayItems

  function selectDate(date: string) {
    setDaySelection({ date, week: weekStart })
  }

  function toggleMealType(mealType: MealType) {
    setSelectedMealTypes((current) =>
      current.includes(mealType)
        ? current.filter((item) => item !== mealType)
        : [...current, mealType],
    )
  }

  async function handleGenerate() {
    if (selectedMealTypes.length === 0) {
      setGenerationError('Escolha pelo menos uma refeição.')
      return
    }

    setIsGenerating(true)
    setGenerationError(null)
    setStatusMessage(null)
    try {
      const generatedItems = generateWeeklyMealPlan({
        baby: currentBaby,
        recipes,
        selectedMealTypes,
        weekStart,
      })
      const expected = selectedMealTypes.length * 7
      if (generatedItems.length < expected) {
        throw new Error('Receitas compatíveis insuficientes')
      }
      await saveMealPlan(currentBaby.id, weekStart, generatedItems)
      analytics.track('meal_plan_generated', {
        meals: generatedItems.length,
        week_start: weekStart,
      })
      await queryClient.invalidateQueries({
        queryKey: mealPlanQueryKey(currentBaby.id, weekStart),
      })
      await queryClient.invalidateQueries({
        queryKey: mealPlanHistoryQueryKey(currentBaby.id),
      })
      setStatusMessage(
        `Semana de ${formatShortDate(weekStart)} pronta com ${generatedItems.length} refeições`,
      )
    } catch {
      setGenerationError(
        'Não há receitas compatíveis suficientes para todas as refeições escolhidas. Tente marcar menos refeições ou revise as restrições no perfil do bebê.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleReplace(recipe: Recipe) {
    if (!replacingItem) return
    const previousName = replacingItem.recipe.name
    setIsReplacing(true)
    try {
      await replaceMealPlanItem(replacingItem.id, recipe.id)
      analytics.track('meal_replaced', { meal_type: replacingItem.meal_type })
      await queryClient.invalidateQueries({
        queryKey: mealPlanQueryKey(currentBaby.id, weekStart),
      })
      setReplacingItem(null)
      setStatusMessage(`${previousName} virou ${recipe.name}.`)
    } finally {
      setIsReplacing(false)
    }
  }

  async function handleRepeatNextWeek() {
    if (!plan) return
    const nextWeek = addDays(weekStart, 7)
    setIsDuplicating(true)
    try {
      await duplicateMealPlan(currentBaby.id, weekStart, nextWeek)
      await queryClient.invalidateQueries({ queryKey: mealPlanHistoryQueryKey(currentBaby.id) })
      await queryClient.invalidateQueries({ queryKey: mealPlanQueryKey(currentBaby.id, nextWeek) })
      goToWeek(nextWeek)
      setStatusMessage(`Cardápio copiado para a semana de ${formatShortDate(nextWeek)}`)
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <BabyAvatar name={currentBaby.name} photoUrl={currentBaby.photo_url} size="lg" />
          <div className="min-w-0">
            <p className="pp-eyebrow">Cardápio de {currentBaby.name}</p>
            <h1 className="mt-1.5 text-[28px] leading-tight text-ink-900 sm:text-[34px]">
              Minha semana
            </h1>
          </div>
        </div>
        <div className="pp-card w-full p-3 sm:w-auto sm:min-w-72">
          <p className="sr-only" id="week-picker-label">
            Semana exibida
          </p>
          <div aria-labelledby="week-picker-label" className="flex items-center gap-2" role="group">
            <button
              aria-label="Ver semana anterior"
              className="pp-icon-btn size-12"
              onClick={() => goToWeek(addDays(weekStart, -7))}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={20} />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-900">
                <CalendarDays aria-hidden="true" className="shrink-0 text-sage-700" size={15} />
                {formatShortDate(weekStart)} – {formatShortDate(addDays(weekStart, 6))}
              </p>
              {weekStart === thisWeekStart ? (
                <p className="mt-0.5 text-xs font-semibold text-sage-700">Semana de hoje</p>
              ) : (
                <button
                  className="pp-link mt-0.5 text-xs"
                  onClick={() => goToWeek(thisWeekStart)}
                  type="button"
                >
                  Voltar para esta semana
                </button>
              )}
            </div>
            <button
              aria-label="Ver próxima semana"
              className="pp-icon-btn size-12"
              onClick={() => goToWeek(addDays(weekStart, 7))}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={20} />
            </button>
          </div>
        </div>
      </header>

      {statusMessage && (
        <p
          aria-live="polite"
          className="pp-badge pp-badge-sage mt-4 w-full justify-start rounded-[14px] px-4 py-3 text-sm leading-6"
          role="status"
        >
          <Check aria-hidden="true" className="shrink-0" size={16} />
          {statusMessage}
        </p>
      )}

      {planLoading ? (
        <div className="mt-6">
          <PageState description="Buscando o cardápio salvo." title="Carregando semana…" />
        </div>
      ) : plan ? (
        <>
          {/* Seletor de dias: onde a mãe está dentro da semana. */}
          <nav aria-label="Dias da semana" className="mt-6">
            <ul className="pp-scroller -mx-5 flex gap-2 px-5 pb-1 sm:-mx-8 sm:px-8">
              {weekDayLabels.map((dayLabel, index) => {
                const date = weekDates[index]
                const isToday = date === todayIso
                const isSelected = date === selectedDate
                const dayCount = (itemsByDate.get(date) ?? []).length
                return (
                  <li key={date}>
                    <button
                      aria-current={isSelected ? 'true' : undefined}
                      aria-label={`${dayLabel}, ${formatShortDate(date)}${isToday ? ', hoje' : ''}, ${dayCount} refeições`}
                      className="pp-selectable min-w-19 flex-col items-center justify-center gap-0 px-3 py-2"
                      onClick={() => selectDate(date)}
                      type="button"
                    >
                      <span className="text-xs font-semibold">{dayLabel}</span>
                      <span className="mt-0.5 text-[11px] text-ink-500">
                        {formatShortDate(date)}
                      </span>
                      {isToday && (
                        <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-sage-700">
                          <span aria-hidden="true" className="size-1.5 rounded-full bg-sage-700" />
                          HOJE
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Destaque do dia selecionado: decisão imediata do que preparar. */}
          {featuredItem ? (
            <section
              aria-labelledby="featured-meal-title"
              className="pp-panel pp-lifted mt-5 overflow-hidden sm:grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
            >
              <RecipeVisual
                imageUrl={featuredItem.recipe.image_url}
                name={featuredItem.recipe.name}
                priority
                size="square"
              />
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pp-badge pp-badge-terracotta">
                    {mealTypeLabels[featuredItem.meal_type]}
                  </span>
                  {selectedDate === todayIso ? (
                    <span className="pp-badge pp-badge-today">
                      Hoje · {formatShortDate(selectedDate)}
                    </span>
                  ) : (
                    <span className="pp-badge pp-badge-sage">
                      {weekDayLabels[selectedDayIndex]} · {formatShortDate(selectedDate)}
                    </span>
                  )}
                </div>
                <h2
                  className="mt-3 text-[26px] leading-[1.12] break-words text-ink-900 sm:text-[30px]"
                  id="featured-meal-title"
                >
                  {featuredItem.recipe.name}
                </h2>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-500">
                  <Clock3 aria-hidden="true" size={15} />
                  {featuredItem.recipe.prep_time_minutes} min · a partir de{' '}
                  {featuredItem.recipe.min_age_months} meses
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Link
                    className="pp-btn pp-btn-primary pp-btn-lg flex-1"
                    state={{ returnTo: `/app/week?week=${weekStart}` }}
                    to={`/app/recipes/${featuredItem.recipe.id}`}
                  >
                    Ver como preparar
                  </Link>
                  <button
                    aria-label={`Trocar ${featuredItem.recipe.name}`}
                    className="pp-btn pp-btn-outline sm:w-auto"
                    onClick={() => setReplacingItem(featuredItem)}
                    type="button"
                  >
                    <RefreshCw aria-hidden="true" size={16} />
                    Trocar
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <div className="mt-5">
              <PageState
                description="Este dia ficou sem refeição planejada. Escolha outro dia ou refaça a semana com mais refeições marcadas."
                icon={CalendarDays}
                title={`Nada planejado em ${formatShortDate(selectedDate)}`}
                variant="empty"
              />
            </div>
          )}

          {/* Demais refeições do dia, na ordem cronológica do dia. */}
          {otherItems.length > 0 && (
            <section aria-labelledby="day-rest-title" className="mt-6">
              <h2 className="text-lg text-ink-900" id="day-rest-title">
                Resto do dia
              </h2>
              <ul className="mt-3 space-y-2">
                {otherItems.map((item) => (
                  <li className="pp-card pp-interactive flex items-center gap-3 p-3" key={item.id}>
                    <RecipeVisual
                      imageUrl={item.recipe.image_url}
                      name={item.recipe.name}
                      size="thumb"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold tracking-[0.06em] text-terracotta-500 uppercase">
                        {mealTypeLabels[item.meal_type]}
                      </p>
                      <Link
                        className="pp-link mt-0.5 block text-sm break-words"
                        state={{ returnTo: `/app/week?week=${weekStart}` }}
                        to={`/app/recipes/${item.recipe.id}`}
                      >
                        {item.recipe.name}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-500">
                        <Clock3 aria-hidden="true" size={12} />
                        {item.recipe.prep_time_minutes} min · Ver como preparar
                      </p>
                    </div>
                    <button
                      aria-label={`Trocar ${item.recipe.name}`}
                      className="pp-btn pp-btn-quiet pp-btn-sm shrink-0"
                      onClick={() => setReplacingItem(item)}
                      type="button"
                    >
                      <RefreshCw aria-hidden="true" size={14} />
                      Trocar
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Semana compacta: organização visível sem competir com o destaque. */}
          <section aria-labelledby="current-week-title" className="pp-panel mt-8 overflow-hidden">
            <div className="border-b border-cream-100 px-4 py-3 sm:px-5">
              <h2 className="text-base text-ink-900" id="current-week-title">
                {weekStart === thisWeekStart
                  ? 'Sua semana atual'
                  : `Semana de ${formatShortDate(weekStart)}`}
              </h2>
            </div>
            <ul className="divide-y divide-cream-100">
              {weekDayLabels.map((dayLabel, index) => {
                const date = weekDates[index]
                const dayItems = itemsByDate.get(date) ?? []
                const isToday = date === todayIso
                const isSelected = date === selectedDate
                return (
                  <li key={date}>
                    <button
                      aria-current={isSelected ? 'true' : undefined}
                      className={`flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-cream-50 sm:px-5 ${
                        isSelected ? 'bg-sage-50' : ''
                      }`}
                      onClick={() => selectDate(date)}
                      type="button"
                    >
                      <span className="w-14 shrink-0">
                        <span className="block text-sm font-semibold text-ink-900">{dayLabel}</span>
                        <span className="block text-[11px] text-ink-500">
                          {formatShortDate(date)}
                        </span>
                      </span>
                      {isToday && (
                        <span className="pp-badge pp-badge-today shrink-0 px-2 py-1 text-[10px]">
                          Hoje
                        </span>
                      )}
                      <span className="min-w-0 flex-1 text-sm leading-snug text-ink-700">
                        {dayItems.length === 0
                          ? 'Sem refeição planejada neste dia.'
                          : dayItems.map((item) => item.recipe.name).join(' · ')}
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="shrink-0 text-ink-500"
                        size={18}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Saídas da semana: compras e impressão. */}
          <section
            aria-label="Levar esta semana para o mercado e para o papel"
            className="pp-panel-quiet mt-6 grid gap-3 p-4 sm:grid-cols-3 sm:p-5"
          >
            <Link
              className="pp-btn pp-btn-primary w-full"
              to={`/app/shopping-list?week=${weekStart}`}
            >
              <ListChecks aria-hidden="true" size={18} />
              Gerar lista de compras
            </Link>
            <PdfExportButton
              baby={currentBaby}
              kind="week"
              label="Imprimir cardápio"
              plan={plan}
              weekStart={weekStart}
            />
            <PdfExportButton
              baby={currentBaby}
              kind="recipes"
              label="Receitas em PDF"
              plan={plan}
              weekStart={weekStart}
            />
          </section>
        </>
      ) : (
        <div className="mt-6">
          <PageState
            description="Escolha as refeições abaixo e monte sua primeira semana em poucos toques."
            icon={CalendarDays}
            title="Nenhum cardápio por aqui ainda"
            variant="empty"
          />
        </div>
      )}

      {/* Montagem da semana: ação de configuração, abaixo do conteúdo. */}
      <section aria-labelledby="generator-title" className="pp-panel mt-8 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-sage-50 text-sage-700">
            <Sparkles aria-hidden="true" size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg text-ink-900" id="generator-title">
              Quais refeições deseja planejar?
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              Usamos apenas receitas compatíveis com a idade e as escolhas de {currentBaby.name}.
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {allMealTypes.map((mealType) => {
            const isChecked = selectedMealTypes.includes(mealType)
            return (
              <label
                className="pp-selectable cursor-pointer text-sm"
                data-selected={isChecked ? 'true' : undefined}
                key={mealType}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                    isChecked
                      ? 'border-sage-600 bg-sage-600 text-white'
                      : 'border-cream-200 bg-white'
                  }`}
                >
                  {isChecked && <Check size={13} strokeWidth={2.6} />}
                </span>
                <input
                  checked={isChecked}
                  className="sr-only"
                  onChange={() => toggleMealType(mealType)}
                  type="checkbox"
                />
                {mealTypeLabels[mealType]}
              </label>
            )
          })}
        </div>
        {generationError && (
          <p
            className="mt-4 rounded-[14px] bg-terracotta-100 px-4 py-3 text-sm leading-6 text-terracotta-500"
            role="alert"
          >
            {generationError}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            className={`pp-btn pp-btn-lg w-full sm:w-auto sm:min-w-64 ${
              plan ? 'pp-btn-secondary' : 'pp-btn-primary'
            }`}
            disabled={isGenerating}
            onClick={handleGenerate}
            type="button"
          >
            <Sparkles aria-hidden="true" size={18} />
            {isGenerating ? 'Montando…' : plan ? 'Refazer esta semana' : 'Montar minha semana'}
          </button>
          {plan && (
            <button
              className="pp-btn pp-btn-quiet w-full sm:w-auto"
              disabled={isDuplicating}
              onClick={handleRepeatNextWeek}
              type="button"
            >
              {isDuplicating ? 'Duplicando…' : 'Repetir na próxima semana'}
            </button>
          )}
        </div>
      </section>

      {history.length > 0 && (
        <section aria-labelledby="week-history-title" className="mt-6">
          <h2 className="text-base text-ink-900" id="week-history-title">
            Semanas salvas
          </h2>
          <ul className="pp-scroller -mx-5 mt-3 flex gap-2 px-5 pb-1 sm:-mx-8 sm:px-8">
            {history.map((savedWeek) => (
              <li key={savedWeek.id}>
                <Link
                  aria-current={savedWeek.week_start === weekStart ? 'true' : undefined}
                  className="pp-selectable min-w-36 flex-col items-start justify-center gap-0 px-3 py-2.5"
                  to={`/app/week?week=${savedWeek.week_start}`}
                >
                  <span className="text-[11px] font-bold tracking-[0.06em] uppercase">
                    {savedWeek.week_start === weekStart
                      ? 'Você está aqui'
                      : savedWeek.week_start === thisWeekStart
                        ? 'Semana de hoje'
                        : 'Semana salva'}
                  </span>
                  <span className="mt-1 text-sm">{formatShortDate(savedWeek.week_start)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {replacingItem && (
        <ReplaceMealDialog
          alternatives={alternatives}
          isSaving={isReplacing}
          item={replacingItem}
          onChoose={handleReplace}
          onClose={() => setReplacingItem(null)}
        />
      )}
    </div>
  )
}
