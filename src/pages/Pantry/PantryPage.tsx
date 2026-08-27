import { Check, Search, ShoppingBasket } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { RecipeCard } from '../../components/recipes/RecipeCard'
import { PageState } from '../../components/ui/PageState'
import { useBaby } from '../../hooks/useBaby'
import { useIngredients, useRecipes } from '../../hooks/useRecipes'
import { rankRecipesByPantry } from '../../lib/pantry/ranking'
import { analytics } from '../../services/analytics'

export function PantryPage() {
  const { data: baby } = useBaby()
  const { data: ingredients = [], error: ingredientsError, isLoading: ingredientsLoading } = useIngredients()
  const { data: recipes = [], error: recipesError, isLoading: recipesLoading } = useRecipes()
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const resultsRef = useRef<HTMLElement>(null)

  const visibleIngredients = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return ingredients.filter((ingredient) =>
      ingredient.name.toLocaleLowerCase('pt-BR').includes(term),
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
    if (!hasSearched) return

    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hasSearched])

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
    analytics.track('pantry_search', { selected_ingredients: selectedIds.length })
  }

  return (
    <div>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-terracotta-500">Aproveite o que já tem</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-ink-900 sm:text-4xl">
          O que tem na sua cozinha hoje?
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-500">
          Marque os ingredientes e encontre receitas demonstrativas compatíveis com {baby.name}.
        </p>
      </div>

      <section className="mt-7 rounded-[24px] border border-cream-100 bg-white p-5 sm:p-6">
        <div className="relative">
          <Search aria-hidden="true" className="absolute top-1/2 left-4 -translate-y-1/2 text-ink-500" size={18} />
          <input
            aria-label="Buscar ingredientes"
            className="min-h-13 w-full rounded-2xl bg-cream-50 pr-4 pl-11 text-base text-ink-900 focus:outline-2 focus:outline-sage-500"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar banana, ovo, aveia…"
            type="search"
            value={search}
          />
        </div>

        <div className="mt-4 grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
          {visibleIngredients.map((ingredient) => {
            const selected = selectedIds.includes(ingredient.id)
            return (
              <button
                aria-pressed={selected}
                className={`flex min-h-12 items-center gap-2 rounded-2xl border px-3 text-left text-sm ${
                  selected
                    ? 'border-sage-500 bg-sage-50 font-semibold text-sage-700'
                    : 'border-cream-100 text-ink-700'
                }`}
                key={ingredient.id}
                onClick={() => toggleIngredient(ingredient.id)}
                type="button"
              >
                <span className={`grid size-5 shrink-0 place-items-center rounded-md ${selected ? 'bg-sage-600 text-white' : 'bg-cream-100'}`}>
                  {selected && <Check aria-hidden="true" size={13} />}
                </span>
                {ingredient.name}
              </button>
            )
          })}
        </div>

        <button
          className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-pumpkin px-5 text-base font-medium text-[#2A2A22] hover:bg-pumpkin/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-56"
          disabled={selectedIds.length === 0}
          onClick={findIdeas}
          type="button"
        >
          <ShoppingBasket aria-hidden="true" size={19} />
          Encontrar ideias
        </button>
      </section>

      {hasSearched && (
        <section ref={resultsRef} className="mt-8 scroll-mt-6" aria-labelledby="pantry-results-title">
          <h2 className="text-2xl font-semibold tracking-[-0.035em] text-ink-900" id="pantry-results-title" tabIndex={-1}>
            Resultados para sua cozinha
          </h2>
          {rankedRecipes.length === 0 ? (
            <div className="mt-4">
              <PageState
                description="Selecione mais ingredientes ou revise as restrições cadastradas."
                title="Nenhuma combinação encontrada"
                variant="empty"
              />
            </div>
          ) : (
            <div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-ink-900">Dá para fazer agora</h3>
                {recipesReady.length === 0 ? (
                  <div className="mt-3 rounded-2xl border border-cream-100 bg-cream-50 p-4">
                    <p className="font-semibold text-ink-900">Nenhuma receita completa com essa seleção.</p>
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
                        scoreLabel="Você tem todos os ingredientes"
                      />
                    ))}
                  </div>
                )}
              </div>

              {recipesMissingIngredients.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-ink-900">Falta pouco</h3>
                  <p className="mt-1 text-sm leading-6 text-ink-500">
                    Estas receitas usam parte do que você marcou, mas ainda precisam dos itens indicados.
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recipesMissingIngredients.map(({ missingIngredientNames, recipe }) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        scoreLabel={`Falta: ${missingIngredientNames.join(', ')}`}
                      />
                    ))}
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
