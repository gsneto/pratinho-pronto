import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  Clock3,
  Heart,
  PackageCheck,
  Plus,
  Replace,
  Share2,
  Snowflake,
  UtensilsCrossed,
  X,
} from 'lucide-react'
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
          <Link className="pp-btn pp-btn-primary" to={returnTo}>
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
  const canFreeze = currentRecipe.storage_notes?.toLowerCase().includes('congel') ?? false

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
      <Link className="pp-link inline-flex items-center gap-2 text-sm" to={returnTo}>
        <ArrowLeft aria-hidden="true" size={18} />
        {returnTo.startsWith('/app/week') ? 'Voltar para minha semana' : 'Voltar para receitas'}
      </Link>

      <article className="pp-panel pp-lifted mt-5 overflow-hidden">
        <RecipeVisual imageUrl={recipe.image_url} name={recipe.name} priority size="hero" />
        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap gap-2">
            <span className="pp-badge pp-badge-sage">{mealTypeLabels[recipe.meal_type]}</span>
            <span className="pp-badge pp-badge-terracotta">Do seu catálogo</span>
          </div>
          <h1 className="mt-4 text-[30px] leading-[1.1] break-words text-ink-900 sm:text-[38px]">
            {recipe.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink-500">
            {publicRecipeText(recipe.description)}
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              className="pp-btn pp-btn-primary pp-btn-lg sm:min-w-64"
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
                className={`pp-btn flex-1 ${
                  isFavorite
                    ? 'border-terracotta-500 bg-terracotta-500 text-white'
                    : 'pp-btn-outline'
                }`}
                disabled={isSavingFavorite}
                onClick={toggleFavorite}
                type="button"
              >
                <Heart aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} size={17} />
                {isFavorite ? 'Nas favoritas' : 'Salvar nas favoritas'}
              </button>
              <button className="pp-btn pp-btn-outline" onClick={handleShare} type="button">
                <Share2 aria-hidden="true" size={17} />
                <span className="sr-only sm:not-sr-only">Compartilhar</span>
              </button>
            </div>
          </div>
          {savedMessage && (
            <div className="pp-sunken mt-4 bg-sage-50 p-4" role="status">
              <p className="flex items-center gap-2 text-sm font-semibold text-sage-700">
                <Check aria-hidden="true" className="shrink-0" size={17} />
                {savedMessage}
              </p>
              <Link className="pp-link mt-2 inline-flex text-sm" to={`/app/week?week=${contextWeekStart}`}>
                Voltar para esta semana
              </Link>
            </div>
          )}
          {shareMessage && (
            <p className="mt-2 text-sm text-ink-500" role="status">
              {shareMessage}
            </p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-4">
            <div className="pp-sunken p-4">
              <Clock3 aria-hidden="true" className="text-sage-700" size={19} />
              <dt className="mt-2 text-xs text-ink-500">Preparo</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-700">
                {recipe.prep_time_minutes} min
              </dd>
            </div>
            <div className="pp-sunken p-4">
              <UtensilsCrossed aria-hidden="true" className="text-sage-700" size={19} />
              <dt className="mt-2 text-xs text-ink-500">Textura sugerida</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-700">
                {textureForRecipe(recipe.min_age_months)}
              </dd>
            </div>
            <div className="pp-sunken p-4">
              <Snowflake aria-hidden="true" className="text-sage-700" size={19} />
              <dt className="mt-2 text-xs text-ink-500">Pode congelar?</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-700">
                {canFreeze ? 'Sim, em porções' : 'Veja a conservação'}
              </dd>
            </div>
            <div className="pp-sunken p-4">
              <PackageCheck aria-hidden="true" className="text-sage-700" size={19} />
              <dt className="mt-2 text-xs text-ink-500">Idade mínima</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-700">
                {recipe.min_age_months} meses
              </dd>
            </div>
          </dl>

          <div className="mt-8 grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
            <section>
              <h2 className="text-xl text-ink-900">Ingredientes</h2>
              <ul className="mt-4 space-y-3">
                {recipe.recipe_ingredients.map((item) => (
                  <li
                    className="flex items-start justify-between gap-4 border-b border-cream-100 pb-3 text-sm"
                    key={item.id}
                  >
                    <span className="text-ink-700">{item.ingredient.name}</span>
                    <span className="shrink-0 text-ink-500">
                      {Number(item.quantity).toLocaleString('pt-BR')} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="pp-sunken mt-5 bg-terracotta-100 p-4">
                <p className="pp-eyebrow">Alergênicos cadastrados</p>
                <p className="mt-2 text-sm leading-6 text-ink-700">
                  {recipe.recipe_allergens.length > 0
                    ? recipe.recipe_allergens.map((item) => item.allergen).join(', ')
                    : 'Nenhum alergênico marcado nesta receita.'}
                </p>
              </div>
            </section>

            <div className="space-y-6">
              <section>
                <h2 className="text-xl text-ink-900">Como preparar</h2>
                {preparationSteps.length === 0 ? (
                  <p className="mt-3 text-sm leading-6 text-ink-500">
                    O passo a passo desta receita ainda não está disponível. Os ingredientes ao lado já
                    mostram o que você precisa.
                  </p>
                ) : (
                  <ol className="mt-4 space-y-4">
                    {preparationSteps.map((step, index) => (
                      <li className="flex gap-3" key={`${index}-${step.slice(0, 12)}`}>
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sage-100 text-xs font-bold text-sage-700">
                          {index + 1}
                        </span>
                        <p className="text-[15px] leading-7 text-ink-700">{step}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
              {recipe.serving_notes && (
                <section className="pp-sunken bg-sage-50 p-5">
                  <h2 className="text-base text-ink-900">Como servir</h2>
                  <p className="mt-2 text-sm leading-6 text-ink-700">{recipe.serving_notes}</p>
                </section>
              )}
              {recipe.storage_notes && (
                <section className="pp-card flex gap-3 p-5">
                  <PackageCheck aria-hidden="true" className="mt-0.5 shrink-0 text-sage-700" size={20} />
                  <div>
                    <h2 className="text-base text-ink-900">Conservação</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-500">{recipe.storage_notes}</p>
                  </div>
                </section>
              )}
              {recipe.substitutions && (
                <section className="pp-card flex gap-3 p-5">
                  <Replace aria-hidden="true" className="mt-0.5 shrink-0 text-sage-700" size={20} />
                  <div>
                    <h2 className="text-base text-ink-900">Trocas possíveis</h2>
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
          className="fixed inset-0 z-40 flex items-end bg-ink-900/45 p-3 sm:items-center sm:justify-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) closePlanner()
          }}
          role="presentation"
        >
          <section
            aria-labelledby="add-recipe-title"
            aria-modal="true"
            className="pp-modal max-h-[88vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="pp-eyebrow">Planejar receita</p>
                <h2 className="mt-1.5 text-2xl break-words text-ink-900" id="add-recipe-title">
                  Quando servir {recipe.name}?
                </h2>
              </div>
              <button
                aria-label="Fechar planejamento"
                className="pp-icon-btn size-11"
                onClick={closePlanner}
                ref={plannerCloseRef}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <p className="mt-2 text-sm text-ink-500">
              Semana de {formatShortDate(contextWeekStart)} a{' '}
              {formatShortDate(addDays(contextWeekStart, 6))}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="pp-field-label">
                Dia
                <select
                  className="pp-field mt-1.5"
                  onChange={(event) =>
                    setDateSelection({ date: event.target.value, week: contextWeekStart })
                  }
                  value={selectedDate}
                >
                  {weekDayLabels.map((day, index) => {
                    const date = addDays(contextWeekStart, index)
                    return (
                      <option key={date} value={date}>
                        {day} · {formatShortDate(date)}
                      </option>
                    )
                  })}
                </select>
              </label>
              <label className="pp-field-label">
                Refeição
                <select
                  className="pp-field mt-1.5"
                  onChange={(event) => setSelectedMealType(event.target.value as MealType)}
                  value={activeMealType}
                >
                  {Object.entries(mealTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {existingSlot && (
              <p className="pp-sunken mt-4 bg-terracotta-100 p-4 text-sm leading-6 text-ink-700">
                Já existe <strong>{existingSlot.recipe.name}</strong> neste horário. Você pode
                substituir ou adicionar como uma opção extra.
              </p>
            )}
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                className="pp-btn pp-btn-primary"
                disabled={isSaving}
                onClick={() => handleAddToWeek(Boolean(existingSlot))}
                type="button"
              >
                {isSaving
                  ? 'Salvando…'
                  : existingSlot
                    ? 'Usar no lugar desta refeição'
                    : `Colocar na ${weekDayLabels[selectedDayIndex] ?? 'semana'}`}
              </button>
              {existingSlot && (
                <button
                  className="pp-btn pp-btn-secondary"
                  disabled={isSaving}
                  onClick={() => handleAddToWeek(false)}
                  type="button"
                >
                  Adicionar como opção extra
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
