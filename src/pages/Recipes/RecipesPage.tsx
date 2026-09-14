import { Heart, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { RecipeCard } from '../../components/recipes/RecipeCard'
import { PageState } from '../../components/ui/PageState'
import { useRecipes } from '../../hooks/useRecipes'
import { useFavorites } from '../../hooks/useFavorites'
import { filterRecipes } from '../../services/recipes'
import type { MealType } from '../../types/domain'
import { mealTypeLabels } from '../../utils/labels'

export function RecipesPage() {
  const { data: recipes = [], error, isLoading } = useRecipes()
  const { data: favoriteIds = [] } = useFavorites()
  const [search, setSearch] = useState('')
  const [mealType, setMealType] = useState<MealType | ''>('')
  const [maxTime, setMaxTime] = useState('')
  const [maxAge, setMaxAge] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)

  const filteredRecipes = useMemo(() => {
    const filtered = filterRecipes(recipes, {
        maxMinAge: maxAge ? Number(maxAge) : undefined,
        maxTime: maxTime ? Number(maxTime) : undefined,
        mealType: mealType || undefined,
        search,
      })
    return showFavorites ? filtered.filter((recipe) => favoriteIds.includes(recipe.id)) : filtered
  }, [favoriteIds, maxAge, maxTime, mealType, recipes, search, showFavorites])

  if (isLoading) {
    return <PageState description="Buscando as receitas do seu catálogo." title="Carregando receitas…" />
  }

  if (error) {
    return (
      <PageState
        description="Confira sua conexão e tente novamente em instantes."
        title="Não foi possível carregar as receitas"
        variant="error"
      />
    )
  }

  return (
    <div>
      <div className="max-w-2xl">
        <p className="pp-eyebrow">Biblioteca do seu catálogo</p>
        <h1 className="mt-1.5 text-[28px] leading-tight text-ink-900 sm:text-[34px]">
          Receitas para planejar, não para acumular
        </h1>
        <p className="mt-3 text-base leading-7 text-ink-500">
          Filtre por refeição, idade e tempo para encontrar uma opção que caiba na sua rotina. Elas não substituem orientação profissional
          individual.
        </p>
      </div>

      <section className="pp-panel mt-6 p-4 sm:p-5">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-500"
            size={18}
          />
          <input
            aria-label="Buscar receitas"
            className="pp-field pl-11"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou descrição"
            type="search"
            value={search}
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="pp-field-label">
            Refeição
            <select
              className="pp-field mt-1.5"
              onChange={(event) => setMealType(event.target.value as MealType | '')}
              value={mealType}
            >
              <option value="">Todas</option>
              {Object.entries(mealTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="pp-field-label">
            Tempo máximo
            <select
              className="pp-field mt-1.5"
              onChange={(event) => setMaxTime(event.target.value)}
              value={maxTime}
            >
              <option value="">Qualquer tempo</option>
              <option value="15">Até 15 min</option>
              <option value="30">Até 30 min</option>
              <option value="45">Até 45 min</option>
            </select>
          </label>
          <label className="pp-field-label">
            Idade mínima até
            <select
              className="pp-field mt-1.5"
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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            aria-pressed={showFavorites}
            className={`pp-btn pp-btn-sm ${
              showFavorites
                ? 'border-terracotta-500 bg-terracotta-500 text-white'
                : 'pp-btn-outline'
            }`}
            onClick={() => setShowFavorites((current) => !current)}
            type="button"
          >
            <Heart aria-hidden="true" fill={showFavorites ? 'currentColor' : 'none'} size={16} />
            {showFavorites ? 'Mostrando favoritas' : 'Minhas favoritas'}
          </button>
          <p aria-live="polite" className="flex items-center gap-2 text-xs text-ink-500">
            <SlidersHorizontal aria-hidden="true" size={15} />
            {filteredRecipes.length} de {recipes.length} receitas
          </p>
        </div>
      </section>

      {filteredRecipes.length === 0 ? (
        <div className="mt-6">
          <PageState
            description="Tente remover um filtro ou buscar por outro termo."
            icon={Search}
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
