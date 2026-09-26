import { Heart, Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RecipeCard } from '../../components/recipes/RecipeCard'
import { PageState } from '../../components/ui/PageState'
import { useRecipes } from '../../hooks/useRecipes'
import { useFavorites } from '../../hooks/useFavorites'
import { filterRecipes } from '../../services/recipes'
import type { MealType } from '../../types/domain'
import { mealTypeLabels } from '../../utils/labels'

const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']

export function RecipesPage() {
  const { data: recipes = [], error, isLoading, refetch } = useRecipes()
  const { data: favoriteIds = [] } = useFavorites()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const rawMealType = searchParams.get('meal') ?? ''
  const mealType = mealTypes.includes(rawMealType as MealType) ? rawMealType as MealType : ''
  const maxTime = searchParams.get('time') ?? ''
  const maxAge = searchParams.get('age') ?? ''
  const showFavorites = searchParams.get('favorites') === 'true'
  const [showFilters, setShowFilters] = useState(Boolean(maxTime || maxAge))
  const hasFilters = Boolean(search || mealType || maxTime || maxAge || showFavorites)

  function updateFilter(key: string, value: string) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }

  const filteredRecipes = useMemo(() => {
    const filtered = filterRecipes(recipes, {
      maxMinAge: maxAge ? Number(maxAge) : undefined,
      maxTime: maxTime ? Number(maxTime) : undefined,
      mealType: mealType || undefined,
      search,
    })
    return showFavorites ? filtered.filter((recipe) => favoriteIds.includes(recipe.id)) : filtered
  }, [favoriteIds, maxAge, maxTime, mealType, recipes, search, showFavorites])

  if (isLoading) return <PageState description="Separando as ideias do seu catálogo." title="Carregando receitas…" />
  if (error) return <PageState description="Confira sua conexão. Seu catálogo continua aqui." title="As receitas não carregaram" variant="error" action={<button className="pp-btn pp-btn-primary" onClick={() => void refetch()} type="button">Tentar novamente</button>} />

  return (
    <div className="pp-recipes">
      <header className="pp-page-header"><p className="pp-eyebrow">Inspiração para o pratinho</p><h1 className="pp-page-title">Receitas para cada descoberta.</h1><p className="pp-page-description">Encontre uma ideia que combine com o dia de vocês. Salve as preferidas para preparar de novo.</p></header>
      <section className="pp-recipe-filters" aria-label="Buscar e filtrar receitas">
        <div className="pp-search-row">
          <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-500" size={19} /><input aria-label="Buscar receitas" className="pp-field pl-12" onChange={(event) => updateFilter('q', event.target.value)} placeholder="Banana, abóbora, panquequinha…" type="search" value={search} /></div>
          <button className="pp-btn pp-btn-secondary px-4" aria-label="Filtros de idade e tempo" aria-expanded={showFilters} aria-controls="recipe-filter-options" onClick={() => setShowFilters((current) => !current)} type="button"><SlidersHorizontal aria-hidden="true" size={20} /></button>
        </div>
        <div className="pp-filter-strip" aria-label="Tipo de refeição" role="group">
          <button className="pp-filter-chip" aria-pressed={!mealType} onClick={() => updateFilter('meal', '')} type="button">Todas</button>
          {mealTypes.map((value) => <button className="pp-filter-chip" aria-pressed={mealType === value} key={value} onClick={() => updateFilter('meal', value)} type="button">{mealTypeLabels[value]}</button>)}
          <button className="pp-filter-chip" aria-pressed={showFavorites} onClick={() => updateFilter('favorites', showFavorites ? '' : 'true')} type="button"><Heart aria-hidden="true" fill={showFavorites ? 'currentColor' : 'none'} size={15} />Favoritas</button>
        </div>
        {showFilters && <div className="pp-filter-options" id="recipe-filter-options">
          <label className="pp-field-label">Tempo de preparo<select className="pp-field mt-2" onChange={(event) => updateFilter('time', event.target.value)} value={maxTime}><option value="">Qualquer tempo</option><option value="15">Até 15 min</option><option value="30">Até 30 min</option><option value="45">Até 45 min</option></select></label>
          <label className="pp-field-label">Idade mínima cadastrada<select className="pp-field mt-2" onChange={(event) => updateFilter('age', event.target.value)} value={maxAge}><option value="">Todas as idades</option>{[6, 7, 8, 9, 12].map((age) => <option key={age} value={age}>Até {age} meses</option>)}</select></label>
          <p className="col-span-full text-xs leading-5 text-ink-500">O filtro de idade não substitui a avaliação de prontidão, alergias e textura para o seu bebê.</p>
        </div>}
        <div className="pp-result-meta"><p aria-live="polite">{filteredRecipes.length} de {recipes.length} receitas</p>{hasFilters && <button className="pp-text-action" onClick={() => setSearchParams({}, { replace: true })} type="button"><X aria-hidden="true" size={15} />Limpar filtros</button>}</div>
      </section>
      {filteredRecipes.length === 0 ? <div className="mt-6"><PageState description={showFavorites ? 'Salve uma receita no coração ou explore o catálogo completo.' : 'Tente outro ingrediente ou retire um dos filtros.'} icon={showFavorites ? Heart : Search} title={showFavorites ? 'Suas favoritas começam aqui' : 'Nenhuma receita por aqui ainda'} variant="empty" action={hasFilters ? <button className="pp-btn pp-btn-secondary" onClick={() => setSearchParams({}, { replace: true })} type="button">Limpar filtros</button> : undefined} /></div> : <div className="pp-recipe-grid">{filteredRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} returnTo={`/app/recipes${searchParams.size ? `?${searchParams.toString()}` : ''}`} />)}</div>}
    </div>
  )
}
