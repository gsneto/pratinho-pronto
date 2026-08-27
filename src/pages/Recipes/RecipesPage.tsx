import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { RecipeCard } from '../../components/recipes/RecipeCard'
import { PageState } from '../../components/ui/PageState'
import { useRecipes } from '../../hooks/useRecipes'
import { filterRecipes } from '../../services/recipes'
import type { MealType } from '../../types/domain'
import { mealTypeLabels } from '../../utils/labels'

export function RecipesPage() {
  const { data: recipes = [], error, isLoading } = useRecipes()
  const [search, setSearch] = useState('')
  const [mealType, setMealType] = useState<MealType | ''>('')
  const [maxTime, setMaxTime] = useState('')
  const [maxAge, setMaxAge] = useState('')

  const filteredRecipes = useMemo(
    () =>
      filterRecipes(recipes, {
        maxMinAge: maxAge ? Number(maxAge) : undefined,
        maxTime: maxTime ? Number(maxTime) : undefined,
        mealType: mealType || undefined,
        search,
      }),
    [maxAge, maxTime, mealType, recipes, search],
  )

  if (isLoading) {
    return <PageState description="Buscando as receitas do seu catálogo." title="Carregando receitas…" />
  }

  if (error) {
    return (
      <PageState
        description="Confira a conexão e se o seed foi aplicado no Supabase."
        title="Não foi possível carregar as receitas"
        variant="error"
      />
    )
  }

  return (
    <div>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-terracotta-500">Biblioteca do seu catálogo</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-ink-900 sm:text-4xl">
          Receitas para planejar, não para acumular
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-500">
          Filtre por refeição, idade e tempo para encontrar uma opção que caiba na sua rotina. Elas não substituem orientação profissional
          individual.
        </p>
      </div>

      <section className="mt-7 rounded-[22px] border border-cream-100 bg-white p-4 sm:p-5">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-4 -translate-y-1/2 text-ink-500"
            size={18}
          />
          <input
            aria-label="Buscar receitas"
            className="min-h-13 w-full rounded-2xl bg-cream-50 pr-4 pl-11 text-base text-ink-900 placeholder:text-ink-500/60 focus:outline-2 focus:outline-sage-500"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou descrição"
            type="search"
            value={search}
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold text-ink-500">
            Refeição
            <select
              className="mt-1 min-h-11 w-full rounded-xl bg-cream-50 px-3 text-sm text-ink-700"
              onChange={(event) => setMealType(event.target.value as MealType | '')}
              value={mealType}
            >
              <option value="">Todas</option>
              {Object.entries(mealTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink-500">
            Tempo máximo
            <select
              className="mt-1 min-h-11 w-full rounded-xl bg-cream-50 px-3 text-sm text-ink-700"
              onChange={(event) => setMaxTime(event.target.value)}
              value={maxTime}
            >
              <option value="">Qualquer tempo</option>
              <option value="15">Até 15 min</option>
              <option value="30">Até 30 min</option>
              <option value="45">Até 45 min</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-ink-500">
            Idade mínima até
            <select
              className="mt-1 min-h-11 w-full rounded-xl bg-cream-50 px-3 text-sm text-ink-700"
              onChange={(event) => setMaxAge(event.target.value)}
              value={maxAge}
            >
              <option value="">Todas</option>
              <option value="6">6 meses</option>
              <option value="7">7 meses</option>
              <option value="8">8 meses</option>
              <option value="9">9 meses</option>
              <option value="12">12 meses</option>
            </select>
          </label>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-ink-500">
          <SlidersHorizontal aria-hidden="true" size={15} />
          {filteredRecipes.length} de {recipes.length} receitas
        </p>
      </section>

      {filteredRecipes.length === 0 ? (
        <div className="mt-6">
          <PageState
            description="Tente remover um filtro ou buscar por outro termo."
            title="Nenhuma receita encontrada"
            variant="empty"
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
