import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Clock3, Heart, PackageCheck, Plus, Replace, Share2, UtensilsCrossed, X } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { RecipeVisual } from '../../components/recipes/RecipeVisual'
import { PageState } from '../../components/ui/PageState'
import { useBaby } from '../../hooks/useBaby'
import { useFavoriteRecipe } from '../../hooks/useFavorites'
import { mealPlanQueryKey, useMealPlan } from '../../hooks/useMealPlan'
import { mealPlanHistoryQueryKey } from '../../hooks/useMealPlanHistory'
import { useRecipe } from '../../hooks/useRecipes'
import { addRecipeToMealPlan } from '../../services/mealPlans'
import type { MealType } from '../../types/domain'
import { addDays, formatShortDate, normalizeWeekStart } from '../../utils/dates'
import { mealTypeLabels, weekDayLabels } from '../../utils/labels'
import { publicRecipeText } from '../../utils/text'
import { splitInstructions } from '../../utils/instructions'

function textureForRecipe(minAgeMonths: number): string {
  if (minAgeMonths <= 6) return 'Amassada'
  if (minAgeMonths <= 8) return 'Macia'
  return 'Pedaços macios'
}

export function RecipeDetailsPage() {
  const { recipeId } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { data: baby } = useBaby()
  const { data: recipe, error, isLoading } = useRecipe(recipeId)
  const { isFavorite, isSaving: isSavingFavorite, toggle: toggleFavorite } = useFavoriteRecipe(
    recipeId ?? '',
  )
  const returnTo =
    typeof location.state === 'object' &&
    location.state !== null &&
    'returnTo' in location.state &&
    typeof location.state.returnTo === 'string'
      ? location.state.returnTo
      : '/app/recipes'
  // Se a mãe chegou aqui a partir de uma semana específica, planejamos nessa
  // semana — não na semana atual — para não perder o contexto dela.
  const contextWeekStart = normalizeWeekStart(
    returnTo.startsWith('/app/week')
      ? new URLSearchParams(returnTo.split('?')[1] ?? '').get('week')
      : null,
  )
  const { data: plan } = useMealPlan(baby?.id, contextWeekStart)
  const [showPlanner, setShowPlanner] = useState(false)
  // O dia escolhido acompanha a semana de contexto sem precisar de efeito:
  // se a semana muda, a seleção anterior deixa de valer.
  const [dateSelection, setDateSelection] = useState<{ date: string; week: string } | null>(null)
  const selectedDate =
    dateSelection && dateSelection.week === contextWeekStart ? dateSelection.date : contextWeekStart
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const plannerCloseRef = useRef<HTMLButtonElement>(null)
  const plannerTriggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showPlanner) return
    plannerCloseRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setShowPlanner(false)
      plannerTriggerRef.current?.focus()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showPlanner])

  function closePlanner() {
    setShowPlanner(false)
    plannerTriggerRef.current?.focus()
  }

  if (isLoading) {
    return <PageState description="Buscando ingredientes e preparo." title="Carregando receita…" />
  }

  if (error || !recipe) {
    return (
      <PageState
        action={
          <Link
            className="inline-flex min-h-13 items-center rounded-2xl bg-pumpkin px-5 text-sm font-medium text-[#2A2A22] hover:bg-pumpkin/90"
            to={returnTo}
          >
            {returnTo.startsWith('/app/week') ? 'Voltar para minha semana' : 'Voltar para receitas'}
          </Link>
        }
        description="Esta receita pode ter saído do catálogo. Você pode voltar e escolher outra."
        title="Receita não encontrada"
        variant="error"
      />
    )
  }

  const currentRecipe = recipe
  const activeMealType = selectedMealType ?? currentRecipe.meal_type
  const preparationSteps = splitInstructions(currentRecipe.instructions)

  const existingSlot = plan?.meal_plan_items.find(
    (item) => item.date === selectedDate && item.meal_type === activeMealType,
  )
  const selectedDayIndex = Math.max(
    0,
    weekDayLabels.findIndex((_, index) => addDays(contextWeekStart, index) === selectedDate),
  )

  async function handleAddToWeek(replaceExisting: boolean) {
    if (!baby) return
    setIsSaving(true)
    setSavedMessage(null)
    try {
      await addRecipeToMealPlan({
        babyId: baby.id,
        date: selectedDate,
        mealType: activeMealType,
        recipeId: currentRecipe.id,
        replaceExisting,
        weekStart: contextWeekStart,
      })
      await queryClient.invalidateQueries({
        queryKey: mealPlanQueryKey(baby.id, contextWeekStart),
      })
      await queryClient.invalidateQueries({ queryKey: mealPlanHistoryQueryKey(baby.id) })
      closePlanner()
      setSavedMessage(
        `${currentRecipe.name} entrou no ${mealTypeLabels[activeMealType].toLowerCase()} de ${formatShortDate(selectedDate)}`,
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleShare() {
    setShareMessage(null)
    try {
      if (navigator.share) {
        await navigator.share({ title: currentRecipe.name, text: publicRecipeText(currentRecipe.description), url: window.location.href })
        return
      }
      await navigator.clipboard?.writeText(window.location.href)
      setShareMessage('Link copiado para compartilhar.')
    } catch {
      setShareMessage('Você pode copiar o endereço desta receita pelo navegador.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-sage-700" to={returnTo}>
        <ArrowLeft aria-hidden="true" size={18} />
        {returnTo.startsWith('/app/week') ? 'Voltar para minha semana' : 'Voltar para receitas'}
      </Link>

      <article className="mt-5 overflow-hidden rounded-[28px] border border-cream-100 bg-white shadow-[0_18px_50px_rgba(65,65,60,0.05)]">
        <RecipeVisual imageUrl={recipe.image_url} name={recipe.name} size="hero" />
        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-sage-50 px-3 py-1.5 text-xs font-semibold text-sage-700">
              {mealTypeLabels[recipe.meal_type]}
            </span>
            <span className="rounded-full bg-terracotta-100 px-3 py-1.5 text-xs font-semibold text-terracotta-500">
              Do seu catálogo
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-ink-900 sm:text-4xl">
            {recipe.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">{publicRecipeText(recipe.description)}</p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-pumpkin px-5 text-sm font-semibold text-[#2A2A22] transition hover:bg-pumpkin/90"
              onClick={() => setShowPlanner(true)}
              ref={plannerTriggerRef}
              type="button"
            >
              <Plus aria-hidden="true" size={18} />
              Colocar na minha semana
            </button>
            <div className="flex gap-2">
              <button
                aria-pressed={isFavorite}
                className={`flex min-h-13 flex-1 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition disabled:opacity-55 ${isFavorite ? 'border-terracotta-500 bg-terracotta-500 text-white' : 'border-cream-100 text-terracotta-500 hover:border-terracotta-500'}`}
                disabled={isSavingFavorite}
                onClick={toggleFavorite}
                type="button"
              >
                <Heart aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} size={17} />
                {isFavorite ? 'Nas favoritas' : 'Salvar nas favoritas'}
              </button>
              <button className="flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-cream-100 px-4 text-sm font-semibold text-sage-700" onClick={handleShare} type="button">
                <Share2 aria-hidden="true" size={17} /> Compartilhar
              </button>
            </div>
          </div>
          {savedMessage && (
            <div className="mt-3 rounded-2xl bg-sage-50 p-4" role="status">
              <p className="flex items-center gap-2 text-sm font-semibold text-sage-700">
                <Check aria-hidden="true" size={17} />
                {savedMessage}
              </p>
              <Link
                className="mt-2 inline-flex text-sm font-semibold text-sage-700 underline decoration-sage-200 underline-offset-2"
                to={`/app/week?week=${contextWeekStart}`}
              >
                Voltar para esta semana
              </Link>
            </div>
          )}
          {shareMessage && <p className="mt-2 text-sm text-ink-500" role="status">{shareMessage}</p>}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-2xl bg-cream-50 p-4">
              <Clock3 aria-hidden="true" className="text-sage-700" size={19} />
              <p className="mt-2 text-xs text-ink-500">Preparo</p>
              <p className="mt-0.5 text-sm font-semibold text-ink-700">{recipe.prep_time_minutes} min</p>
            </div>
            <div className="rounded-2xl bg-cream-50 p-4">
              <UtensilsCrossed aria-hidden="true" className="text-sage-700" size={19} />
              <p className="mt-2 text-xs text-ink-500">Textura sugerida</p>
              <p className="mt-0.5 text-sm font-semibold text-ink-700">{textureForRecipe(recipe.min_age_months)}</p>
            </div>
            <div className="rounded-2xl bg-cream-50 p-4">
              <PackageCheck aria-hidden="true" className="text-sage-700" size={19} />
              <p className="mt-2 text-xs text-ink-500">Pode congelar?</p>
              <p className="mt-0.5 text-sm font-semibold text-ink-700">{recipe.storage_notes?.toLowerCase().includes('congel') ? 'Sim, em porções' : 'Veja a conservação'}</p>
            </div>
            <div className="rounded-2xl bg-cream-50 p-4">
              <UtensilsCrossed aria-hidden="true" className="text-sage-700" size={19} />
              <p className="mt-2 text-xs text-ink-500">Idade mínima</p>
              <p className="mt-0.5 text-sm font-semibold text-ink-700">{recipe.min_age_months} meses</p>
            </div>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
            <section>
              <h2 className="text-xl font-semibold tracking-[-0.025em] text-ink-900">Ingredientes</h2>
              <ul className="mt-4 space-y-3">
                {recipe.recipe_ingredients.map((item) => (
                  <li className="flex items-start justify-between gap-4 border-b border-cream-100 pb-3 text-sm" key={item.id}>
                    <span className="text-ink-700">{item.ingredient.name}</span>
                    <span className="shrink-0 text-ink-500">
                      {Number(item.quantity).toLocaleString('pt-BR')} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-2xl bg-terracotta-100/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-terracotta-500">Alergênicos cadastrados</p>
                <p className="mt-2 text-sm leading-6 text-ink-700">
                  {recipe.recipe_allergens.length > 0
                    ? recipe.recipe_allergens.map((item) => item.allergen).join(', ')
                    : 'Nenhum alergênico marcado nesta receita.'}
                </p>
              </div>
            </section>

            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold tracking-[-0.025em] text-ink-900">Como preparar</h2>
                {preparationSteps.length === 0 ? (
                  <p className="mt-3 text-sm leading-6 text-ink-500">
                    O passo a passo desta receita ainda não está disponível. Os ingredientes ao lado já
                    mostram o que você precisa.
                  </p>
                ) : (
                  <ol className="mt-4 space-y-3">
                    {preparationSteps.map((step, index) => (
                      <li className="flex gap-3" key={`${index}-${step.slice(0, 12)}`}>
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sage-50 text-xs font-semibold text-sage-700">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-6 text-ink-700">{step}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
              {recipe.serving_notes && (
                <section className="rounded-2xl bg-sage-50 p-5">
                  <h2 className="text-base font-semibold text-ink-900">Como servir</h2>
                  <p className="mt-2 text-sm leading-6 text-ink-500">{recipe.serving_notes}</p>
                </section>
              )}
              {recipe.storage_notes && (
                <section className="flex gap-3 rounded-2xl border border-cream-100 p-5">
                  <PackageCheck aria-hidden="true" className="mt-0.5 shrink-0 text-sage-700" size={20} />
                  <div>
                    <h2 className="text-base font-semibold text-ink-900">Conservação</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-500">{recipe.storage_notes}</p>
                  </div>
                </section>
              )}
              {recipe.substitutions && (
                <section className="flex gap-3 rounded-2xl border border-cream-100 p-5">
                  <Replace aria-hidden="true" className="mt-0.5 shrink-0 text-sage-700" size={20} />
                  <div>
                    <h2 className="text-base font-semibold text-ink-900">Trocas possíveis</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-500">{recipe.substitutions}</p>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </article>

      {showPlanner && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-ink-900/35 p-3 sm:items-center sm:justify-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) closePlanner()
          }}
          role="presentation"
        >
          <section aria-labelledby="add-recipe-title" aria-modal="true" className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[26px] bg-white p-5 shadow-2xl sm:p-6" role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-terracotta-500">Planejar receita</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-ink-900" id="add-recipe-title">Quando servir {recipe.name}?</h2>
              </div>
              <button aria-label="Fechar planejamento" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream-50 text-ink-700" onClick={closePlanner} ref={plannerCloseRef} type="button"><X aria-hidden="true" size={20} /></button>
            </div>
            <p className="mt-2 text-sm text-ink-500">
              Semana de {formatShortDate(contextWeekStart)} a {formatShortDate(addDays(contextWeekStart, 6))}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-ink-500">Dia
                <select className="mt-1 min-h-12 w-full rounded-xl bg-cream-50 px-3 text-sm text-ink-700" onChange={(event) => setDateSelection({ date: event.target.value, week: contextWeekStart })} value={selectedDate}>
                  {weekDayLabels.map((day, index) => { const date = addDays(contextWeekStart, index); return <option key={date} value={date}>{day} · {formatShortDate(date)}</option> })}
                </select>
              </label>
              <label className="text-xs font-semibold text-ink-500">Refeição
                <select className="mt-1 min-h-12 w-full rounded-xl bg-cream-50 px-3 text-sm text-ink-700" onChange={(event) => setSelectedMealType(event.target.value as MealType)} value={activeMealType}>
                  {Object.entries(mealTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
            {existingSlot && <p className="mt-4 rounded-2xl bg-terracotta-100/60 p-4 text-sm leading-6 text-ink-700">Já existe <strong>{existingSlot.recipe.name}</strong> neste horário. Você pode substituir ou adicionar como uma opção extra.</p>}
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button className="min-h-13 rounded-2xl bg-pumpkin px-4 text-sm font-semibold text-[#2A2A22] disabled:opacity-55" disabled={isSaving} onClick={() => handleAddToWeek(Boolean(existingSlot))} type="button">{isSaving ? 'Salvando…' : existingSlot ? 'Usar no lugar desta refeição' : `Colocar na ${weekDayLabels[selectedDayIndex] ?? 'semana'}`}</button>
              {existingSlot && <button className="min-h-13 rounded-2xl border border-cream-100 px-4 text-sm font-semibold text-sage-700 disabled:opacity-55" disabled={isSaving} onClick={() => handleAddToWeek(false)} type="button">Adicionar como opção extra</button>}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
