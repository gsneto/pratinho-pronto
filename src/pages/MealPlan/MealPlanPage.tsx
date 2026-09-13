import { useQueryClient } from '@tanstack/react-query'
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Sparkles } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { ReplaceMealDialog } from '../../components/meal-plan/ReplaceMealDialog'
import { BabyAvatar, BabyPhotoBackdrop } from '../../components/baby/BabyAvatar'
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
          <button
            className="min-h-13 rounded-2xl bg-pumpkin px-5 text-sm font-medium text-[#2A2A22] hover:bg-pumpkin/90"
            onClick={() => window.location.reload()}
            type="button"
          >
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
    <div>
      <div className="relative isolate overflow-hidden rounded-[24px] border border-cream-100 bg-white p-5 sm:p-6">
        <BabyPhotoBackdrop name={currentBaby.name} photoUrl={currentBaby.photo_url} />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <BabyAvatar name={currentBaby.name} photoUrl={currentBaby.photo_url} size="lg" />
            <div>
              <p className="text-sm font-semibold text-terracotta-500">Cardápio de {currentBaby.name}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-ink-900 sm:text-4xl">
                Montar minha semana
              </h1>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500" id="week-picker-label">
              Semana exibida
            </p>
            <div className="mt-1 flex items-center gap-2" role="group" aria-labelledby="week-picker-label">
              <button
                aria-label="Ver semana anterior"
                className="grid size-12 shrink-0 place-items-center rounded-2xl border border-cream-100 bg-white text-ink-700 transition hover:border-sage-500"
                onClick={() => goToWeek(addDays(weekStart, -7))}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={19} />
              </button>
              <div className="min-w-0 flex-1 text-center">
                <p className="text-sm font-semibold text-ink-900">
                  {formatShortDate(weekStart)} a {formatShortDate(addDays(weekStart, 6))}
                </p>
                {weekStart === thisWeekStart ? (
                  <p className="text-[11px] font-semibold text-sage-700">Semana de hoje</p>
                ) : (
                  <button
                    className="text-[11px] font-semibold text-sage-700 underline decoration-sage-200 underline-offset-2"
                    onClick={() => goToWeek(thisWeekStart)}
                    type="button"
                  >
                    Voltar para esta semana
                  </button>
                )}
              </div>
              <button
                aria-label="Ver próxima semana"
                className="grid size-12 shrink-0 place-items-center rounded-2xl border border-cream-100 bg-white text-ink-700 transition hover:border-sage-500"
                onClick={() => goToWeek(addDays(weekStart, 7))}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={19} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <p
          aria-live="polite"
          className="mt-4 rounded-2xl bg-sage-50 px-4 py-3 text-sm font-semibold text-sage-700"
          role="status"
        >
          {statusMessage}
        </p>
      )}

      {history.length > 0 && (
        <section className="mt-5 rounded-[22px] border border-cream-100 bg-white p-4 sm:p-5" aria-labelledby="week-history-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-terracotta-500">Seu histórico</p>
              <h2 className="mt-1 text-lg font-semibold text-ink-900" id="week-history-title">Semanas salvas</h2>
            </div>
            {plan && (
              <button
                className="min-h-11 rounded-xl bg-sage-50 px-3 text-sm font-semibold text-sage-700 disabled:opacity-55"
                disabled={isDuplicating}
                onClick={handleRepeatNextWeek}
                type="button"
              >
                {isDuplicating ? 'Duplicando…' : 'Repetir na próxima semana'}
              </button>
            )}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {history.map((savedWeek) => (
              <Link
                aria-current={savedWeek.week_start === weekStart ? 'true' : undefined}
                className={`min-w-36 rounded-xl border px-3 py-2.5 text-left text-sm transition ${savedWeek.week_start === weekStart ? 'border-sage-500 bg-sage-50 text-sage-700' : 'border-cream-100 text-ink-700 hover:border-sage-300'}`}
                key={savedWeek.id}
                to={`/app/week?week=${savedWeek.week_start}`}
              >
                <span className="block text-xs font-semibold uppercase tracking-[0.08em]">
                  {savedWeek.week_start === weekStart
                    ? 'Você está aqui'
                    : savedWeek.week_start === thisWeekStart
                      ? 'Semana de hoje'
                      : 'Semana salva'}
                </span>
                <span className="mt-1 block">{formatShortDate(savedWeek.week_start)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 rounded-[24px] border border-cream-100 bg-white p-5 shadow-[0_12px_40px_rgba(65,65,60,0.04)] sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-sage-50 text-sage-700">
            <Sparkles aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Quais refeições deseja planejar?</h2>
            <p className="mt-1 text-xs text-ink-500">Usamos apenas receitas compatíveis com a idade e as escolhas de {currentBaby.name}.</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {allMealTypes.map((mealType) => (
            <label
              className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border px-3 text-sm font-medium ${
                selectedMealTypes.includes(mealType)
                  ? 'border-sage-500 bg-sage-50 text-sage-700'
                  : 'border-cream-100 text-ink-500'
              }`}
              key={mealType}
            >
              <input
                checked={selectedMealTypes.includes(mealType)}
                className="accent-sage-600"
                onChange={() => toggleMealType(mealType)}
                type="checkbox"
              />
              {mealTypeLabels[mealType]}
            </label>
          ))}
        </div>
        {generationError && <p className="mt-4 text-sm text-terracotta-500" role="alert">{generationError}</p>}
        <button
          className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-pumpkin px-5 text-base font-medium text-[#2A2A22] hover:bg-pumpkin/90 disabled:opacity-55 sm:w-auto sm:min-w-64"
          disabled={isGenerating}
          onClick={handleGenerate}
          type="button"
        >
          {isGenerating ? 'Montando…' : plan ? 'Refazer esta semana' : 'Montar minha semana'}
          <Sparkles aria-hidden="true" size={18} />
        </button>
      </section>

      {planLoading ? (
        <div className="mt-6">
          <PageState description="Buscando o cardápio salvo." title="Carregando semana…" />
        </div>
      ) : !plan ? (
        <div className="mt-6">
          <PageState
            description="Escolha as refeições acima e monte sua primeira semana em poucos cliques."
            title="Nenhum cardápio por aqui ainda"
            variant="empty"
          />
        </div>
      ) : (
        <section className="mt-8" aria-labelledby="current-week-title">
          <div className="flex items-center gap-3">
            <CalendarDays aria-hidden="true" className="text-sage-700" size={22} />
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-ink-900" id="current-week-title">
              {weekStart === thisWeekStart ? 'Sua semana atual' : `Semana de ${formatShortDate(weekStart)}`}
            </h2>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {weekDayLabels.map((dayLabel, index) => {
              const date = addDays(weekStart, index)
              const dayItems = itemsByDate.get(date) ?? []
              const isToday = date === todayIso
              return (
                <article
                  className={`rounded-[22px] border bg-white p-5 ${isToday ? 'border-sage-500 ring-1 ring-sage-500/40' : 'border-cream-100'}`}
                  key={date}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-ink-900">
                      {dayLabel}
                      {isToday && (
                        <span className="rounded-full bg-sage-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sage-700">
                          Hoje
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-ink-500">{formatShortDate(date)}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {dayItems.length === 0 ? (
                      <p className="rounded-2xl bg-cream-50 px-3 py-3 text-sm text-ink-500">
                        Sem refeição planejada neste dia.
                      </p>
                    ) : dayItems.map((item) => (
                      <div className="flex items-center gap-3 rounded-2xl bg-cream-50 px-3 py-3" key={item.id}>
                        <RecipeVisual imageUrl={item.recipe.image_url} name={item.recipe.name} size="thumb" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-terracotta-500">
                            {mealTypeLabels[item.meal_type]}
                          </p>
                          <Link
                            className="mt-1 block truncate text-sm font-medium text-sage-700 underline decoration-sage-200 underline-offset-2 transition hover:text-terracotta-500 hover:decoration-terracotta-200 focus:outline-none focus:ring-2 focus:ring-pumpkin focus:ring-offset-2"
                            state={{ returnTo: `/app/week?week=${weekStart}` }}
                            to={`/app/recipes/${item.recipe.id}`}
                          >
                            {item.recipe.name}
                          </Link>
                          <span className="mt-1 block text-[11px] text-ink-500">Ver como preparar</span>
                        </div>
                        <button
                          aria-label={`Trocar ${item.recipe.name}`}
                          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-semibold text-sage-700 transition hover:bg-sage-50"
                          onClick={() => setReplacingItem(item)}
                          type="button"
                        >
                          <RefreshCw aria-hidden="true" size={14} />
                          Trocar
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
          <div className="mt-6 grid gap-3 rounded-[22px] bg-sage-50 p-4 sm:grid-cols-2 sm:p-5">
            <PdfExportButton
              baby={currentBaby}
              kind="week"
              label="Imprimir cardápio da semana"
              plan={plan}
              weekStart={weekStart}
            />
            <PdfExportButton
              baby={currentBaby}
              kind="recipes"
              label="Receitas da semana em PDF"
              plan={plan}
              weekStart={weekStart}
            />
            <Link
              className="flex min-h-13 items-center justify-center rounded-2xl border border-sage-200 bg-white px-5 text-center text-sm font-semibold text-sage-700 transition hover:border-sage-500"
              to={`/app/shopping-list?week=${weekStart}`}
            >
              Gerar lista de compras
            </Link>
          </div>
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
