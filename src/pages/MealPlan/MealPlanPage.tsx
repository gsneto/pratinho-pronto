import { useQueryClient } from '@tanstack/react-query'
import { CalendarDays, RefreshCw, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ReplaceMealDialog } from '../../components/meal-plan/ReplaceMealDialog'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { PageState } from '../../components/ui/PageState'
import { useBaby } from '../../hooks/useBaby'
import { mealPlanQueryKey, useMealPlan } from '../../hooks/useMealPlan'
import { useRecipes } from '../../hooks/useRecipes'
import {
  generateWeeklyMealPlan,
  getCompatibleRecipes,
} from '../../lib/meal-plan/generator'
import { analytics } from '../../services/analytics'
import { replaceMealPlanItem, saveMealPlan } from '../../services/mealPlans'
import type { MealPlanItem, MealType, Recipe } from '../../types/domain'
import { addDays, formatShortDate, getWeekStart, parseIsoDate } from '../../utils/dates'
import { mealTypeLabels, weekDayLabels } from '../../utils/labels'

const allMealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']

export function MealPlanPage() {
  const queryClient = useQueryClient()
  const { data: baby } = useBaby()
  const { data: recipes = [], error: recipesError, isLoading: recipesLoading } = useRecipes()
  const [weekStart, setWeekStart] = useState(getWeekStart())
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>(allMealTypes)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [replacingItem, setReplacingItem] = useState<MealPlanItem | null>(null)
  const [isReplacing, setIsReplacing] = useState(false)
  const { data: plan, error: planError, isLoading: planLoading } = useMealPlan(
    baby?.id,
    weekStart,
  )

  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, MealPlanItem[]>()
    plan?.meal_plan_items
      .slice()
      .sort((a, b) => a.meal_type.localeCompare(b.meal_type))
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
        description="Não foi possível carregar os dados necessários para o cardápio."
        title="Semana indisponível"
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
    } catch {
      setGenerationError(
        'Não há receitas compatíveis suficientes para todas as escolhas. Revise os filtros do bebê ou o seed.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleReplace(recipe: Recipe) {
    if (!replacingItem) return
    setIsReplacing(true)
    try {
      await replaceMealPlanItem(replacingItem.id, recipe.id)
      analytics.track('meal_replaced', { meal_type: replacingItem.meal_type })
      await queryClient.invalidateQueries({
        queryKey: mealPlanQueryKey(currentBaby.id, weekStart),
      })
      setReplacingItem(null)
    } finally {
      setIsReplacing(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-terracotta-500">Cardápio de {currentBaby.name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-ink-900 sm:text-4xl">
            Montar minha semana
          </h1>
        </div>
        <label className="text-xs font-semibold text-ink-500">
          Segunda-feira da semana
          <input
            className="mt-1 block min-h-12 rounded-2xl border border-cream-100 bg-white px-4 text-sm text-ink-700"
            onChange={(event) => setWeekStart(event.target.value)}
            type="date"
            value={weekStart}
          />
        </label>
      </div>

      <section className="mt-6 rounded-[24px] border border-cream-100 bg-white p-5 shadow-[0_12px_40px_rgba(65,65,60,0.04)] sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-sage-50 text-sage-700">
            <Sparkles aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Quais refeições deseja planejar?</h2>
            <p className="mt-1 text-xs text-ink-500">A geração é determinística e usa apenas o banco.</p>
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
          className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-sage-600 px-5 text-base font-semibold text-white disabled:opacity-55 sm:w-auto sm:min-w-64"
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
              Sua semana atual
            </h2>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {weekDayLabels.map((dayLabel, index) => {
              const date = addDays(weekStart, index)
              const dayItems = itemsByDate.get(date) ?? []
              return (
                <article className="rounded-[22px] border border-cream-100 bg-white p-5" key={date}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-ink-900">{dayLabel}</h3>
                    <span className="text-xs text-ink-500">{formatShortDate(date)}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {dayItems.map((item) => (
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-cream-50 px-4 py-3" key={item.id}>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-terracotta-500">
                            {mealTypeLabels[item.meal_type]}
                          </p>
                          <p className="mt-1 truncate text-sm font-medium text-ink-700">{item.recipe.name}</p>
                        </div>
                        <button
                          className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-semibold text-sage-700"
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
              label="Imprimir minha semana"
              plan={plan}
            />
            <PdfExportButton
              baby={currentBaby}
              kind="recipes"
              label="Receitas da semana"
              plan={plan}
            />
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
