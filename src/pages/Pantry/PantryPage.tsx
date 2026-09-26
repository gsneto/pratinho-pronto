import { Check, Search, ShoppingBasket, Sparkles, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { RecipeCard } from '../../components/recipes/RecipeCard'
import { PageState } from '../../components/ui/PageState'
import { useBaby } from '../../hooks/useBaby'
import { useIngredients, useRecipes } from '../../hooks/useRecipes'
import { useMealPlan } from '../../hooks/useMealPlan'
import { shoppingListQueryKey } from '../../hooks/useShoppingList'
import { rankRecipesByPantry } from '../../lib/pantry/ranking'
import { analytics } from '../../services/analytics'
import { appendShoppingListItems } from '../../services/shoppingLists'
import { getWeekStart } from '../../utils/dates'
import { normalizeTerm } from '../../utils/text'

export function PantryPage() {
  const queryClient = useQueryClient()
  const { data: baby } = useBaby()
  const { data: ingredients = [], error: ingredientsError, isLoading: ingredientsLoading } = useIngredients()
  const { data: recipes = [], error: recipesError, isLoading: recipesLoading } = useRecipes()
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [searchCount, setSearchCount] = useState(0)
  const [addingMissingRecipeId, setAddingMissingRecipeId] = useState<string | null>(null)
  const [addedMissingRecipeIds, setAddedMissingRecipeIds] = useState<string[]>([])
  const [listError, setListError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLElement>(null)
  const resultsTitleRef = useRef<HTMLHeadingElement>(null)
  const currentWeekStart = getWeekStart()
  const { data: currentPlan } = useMealPlan(baby?.id, currentWeekStart)

  const visibleIngredients = useMemo(() => {
    const term = normalizeTerm(search)
    return ingredients.filter((ingredient) =>
      normalizeTerm(ingredient.name).includes(term),
    )
  }, [ingredients, search])

  const rankedRecipes = useMemo(
    () =>
      baby && hasSearched
        ? rankRecipesByPantry({ baby, recipes, selectedIngredientIds: selectedIds })
        : [],
    [baby, hasSearched, recipes, selectedIds],
  )

  const recipesReady = useMemo(
    () => rankedRecipes.filter((item) => item.canMakeNow),
    [rankedRecipes],
  )
  const recipesMissingIngredients = useMemo(
    () => rankedRecipes.filter((item) => !item.canMakeNow).slice(0, 6),
    [rankedRecipes],
  )

  useEffect(() => {
    if (searchCount === 0) return

    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    resultsTitleRef.current?.focus()
  }, [searchCount])

  if (!baby || ingredientsLoading || recipesLoading) {
    return <PageState description="Carregando ingredientes e receitas." title="Abrindo sua cozinha…" />
  }

  if (ingredientsError || recipesError) {
    return (
      <PageState
        description="Não foi possível consultar o catálogo de ingredientes."
        title="Cozinha indisponível"
        variant="error"
      />
    )
  }

  function toggleIngredient(ingredientId: string) {
    setHasSearched(false)
    setSelectedIds((current) =>
      current.includes(ingredientId)
        ? current.filter((id) => id !== ingredientId)
        : [...current, ingredientId],
    )
  }

  function findIdeas() {
    setHasSearched(true)
    setSearchCount((current) => current + 1)
    analytics.track('pantry_search', { selected_ingredients: selectedIds.length })
  }

  async function addMissingIngredients(recipeId: string) {
    if (!currentPlan) return
    const ranked = rankedRecipes.find((item) => item.recipe.id === recipeId)
    if (!ranked) return
    const missingItems = ranked.recipe.recipe_ingredients
      .filter((item) => !item.is_optional && !selectedIds.includes(item.ingredient_id))
      .map((item) => ({ ingredient_id: item.ingredient_id, quantity: item.quantity, unit: item.unit }))
    setAddingMissingRecipeId(recipeId)
    setListError(null)
    try {
      await appendShoppingListItems(currentPlan.id, missingItems)
      await queryClient.invalidateQueries({ queryKey: shoppingListQueryKey(currentPlan.id) })
      setAddedMissingRecipeIds((current) => [...current, recipeId])
      analytics.track('shopping_list_generated', { meal_plan_id: currentPlan.id, source: 'pantry_missing' })
    } catch {
      setListError('Não conseguimos adicionar esses itens à lista agora. Tente novamente em instantes.')
    } finally {
      setAddingMissingRecipeId(null)
    }
  }

  const selectedIngredients = ingredients.filter((ingredient) => selectedIds.includes(ingredient.id))

  return (
    <div className="pp-pantry mx-auto max-w-4xl">
      <header className="pp-page-header">
        <p className="pp-eyebrow">Aproveite o que já tem</p>
        <h1 className="pp-page-title">
          O que tem na sua cozinha hoje?
        </h1>
        <p className="pp-page-description">
          Marque os ingredientes e encontre receitas compatíveis com {baby.name}.
        </p>
      </header>

      <section aria-label="Selecionar ingredientes" className="pp-panel mt-6 p-5 sm:p-6">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-500"
            size={18}
          />
          <input
            aria-label="Buscar ingredientes"
            className="pp-field pl-11"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar banana, ovo, aveia…"
            type="search"
            value={search}
          />
        </div>

        {selectedIngredients.length > 0 && (
          <div className="pp-sunken mt-4 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-ink-700" role="status">
                {selectedIngredients.length}{' '}
                {selectedIngredients.length === 1 ? 'ingrediente marcado' : 'ingredientes marcados'}
              </p>
              <button
                className="pp-text-action min-h-11 px-2 text-xs"
                onClick={() => {
                  setSelectedIds([])
                  setHasSearched(false)
                }}
                type="button"
              >
                Limpar tudo
              </button>
            </div>
            <ul className="mt-2 flex flex-wrap gap-2">
              {selectedIngredients.map((ingredient) => (
                <li key={ingredient.id}>
                  <button
                    aria-label={`Remover ${ingredient.name}`}
                    className="pp-badge pp-badge-sage min-h-11 transition-colors hover:bg-sage-100"
                    onClick={() => toggleIngredient(ingredient.id)}
                    type="button"
                  >
                    {ingredient.name}
                    <X aria-hidden="true" size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
          {visibleIngredients.length === 0 ? (
            <p className="col-span-full py-6 text-center text-sm text-ink-500">
              Nenhum ingrediente com esse nome. Tente escrever de outra forma.
            </p>
          ) : visibleIngredients.map((ingredient) => {
            const selected = selectedIds.includes(ingredient.id)
            return (
              <button
                aria-pressed={selected}
                className="pp-selectable text-sm"
                key={ingredient.id}
                onClick={() => toggleIngredient(ingredient.id)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                    selected
                      ? 'border-sage-600 bg-sage-600 text-white'
                      : 'border-cream-200 bg-white'
                  }`}
                >
                  {selected && <Check size={13} strokeWidth={2.6} />}
                </span>
                <span className="min-w-0 break-words">{ingredient.name}</span>
              </button>
            )
          })}
        </div>

        <button
          className="pp-btn pp-btn-primary pp-btn-lg mt-5 w-full sm:w-auto sm:min-w-56"
          disabled={selectedIds.length === 0}
          onClick={findIdeas}
          type="button"
        >
          <ShoppingBasket aria-hidden="true" size={19} />
          Encontrar ideias
        </button>
        {selectedIds.length === 0 && (
          <p className="mt-2 text-xs text-ink-500">Marque pelo menos um ingrediente para buscar.</p>
        )}
      </section>

      {listError && (
        <p
          className="mt-4 rounded-[14px] bg-terracotta-100 px-4 py-3 text-sm leading-6 text-terracotta-500"
          role="alert"
        >
          {listError}
        </p>
      )}

      {hasSearched && (
        <section aria-labelledby="pantry-results-title" className="mt-8 scroll-mt-6" ref={resultsRef}>
          <h2
            className="text-2xl text-ink-900"
            id="pantry-results-title"
            ref={resultsTitleRef}
            tabIndex={-1}
          >
            Resultados para sua cozinha
          </h2>
          <p aria-live="polite" className="mt-1.5 text-sm leading-6 text-ink-500">
            {rankedRecipes.length === 0
              ? 'Nenhuma receita encontrada com os filtros atuais.'
              : `${recipesReady.length} ${recipesReady.length === 1 ? 'receita pronta' : 'receitas prontas'} e ${recipesMissingIngredients.length} ${recipesMissingIngredients.length === 1 ? 'opção quase completa' : 'opções quase completas'}.`}
          </p>
          {rankedRecipes.length === 0 ? (
            <div className="mt-4">
              <PageState
                description="Selecione mais ingredientes ou revise as restrições cadastradas."
                icon={Sparkles}
                title="Nenhuma combinação encontrada"
                variant="empty"
              />
            </div>
          ) : (
            <div>
              <div className="mt-6">
                <h3 className="text-lg text-ink-900">Dá para fazer agora</h3>
                {recipesReady.length === 0 ? (
                  <div className="pp-panel-quiet mt-3 p-4">
                    <p className="font-semibold text-ink-900">
                      Nenhuma receita completa com essa seleção.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-500">
                      Veja abaixo quais ingredientes faltam ou marque mais itens que você tem em casa.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recipesReady.map(({ recipe }) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        returnTo="/app/pantry"
                        scoreLabel="Você tem todos os ingredientes"
                      />
                    ))}
                  </div>
                )}
              </div>

              {recipesMissingIngredients.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg text-ink-900">Falta pouco</h3>
                  <p className="mt-1.5 text-sm leading-6 text-ink-500">
                    Estas receitas usam parte do que você marcou, mas ainda precisam dos itens indicados.
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recipesMissingIngredients.map(({ missingIngredientNames, matchedCount, totalRequired, recipe }) => {
                      const alreadyAdded = addedMissingRecipeIds.includes(recipe.id)
                      return (
                        <RecipeCard
                          key={recipe.id}
                          recipe={recipe}
                          isAddingMissing={addingMissingRecipeId === recipe.id}
                          missingActionDisabled={!currentPlan || alreadyAdded}
                          missingActionHint={
                            currentPlan
                              ? undefined
                              : 'Monte o cardápio desta semana para usar a lista de compras.'
                          }
                          missingAdded={alreadyAdded}
                          missingIngredientNames={missingIngredientNames}
                          onAddMissing={() => void addMissingIngredients(recipe.id)}
                          returnTo="/app/pantry"
                          scoreLabel={`Você tem ${matchedCount} de ${totalRequired} ingredientes`}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
