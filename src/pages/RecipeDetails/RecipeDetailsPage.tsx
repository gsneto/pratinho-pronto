import { ArrowLeft, Clock3, PackageCheck, Replace, UtensilsCrossed } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { RecipeVisual } from '../../components/recipes/RecipeVisual'
import { PageState } from '../../components/ui/PageState'
import { useRecipe } from '../../hooks/useRecipes'
import { mealTypeLabels } from '../../utils/labels'

export function RecipeDetailsPage() {
  const { recipeId } = useParams()
  const location = useLocation()
  const { data: recipe, error, isLoading } = useRecipe(recipeId)
  const returnTo =
    typeof location.state === 'object' &&
    location.state !== null &&
    'returnTo' in location.state &&
    typeof location.state.returnTo === 'string'
      ? location.state.returnTo
      : '/app/recipes'

  if (isLoading) {
    return <PageState description="Buscando ingredientes e preparo." title="Carregando receita…" />
  }

  if (error || !recipe) {
    return (
      <PageState
        description="A receita pode ter sido removida ou está temporariamente indisponível."
        title="Receita não encontrada"
        variant="error"
      />
    )
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
              Receita de demonstração
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-ink-900 sm:text-4xl">
            {recipe.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">{recipe.description}</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-2xl bg-cream-50 p-4">
              <Clock3 aria-hidden="true" className="text-sage-700" size={19} />
              <p className="mt-2 text-xs text-ink-500">Preparo</p>
              <p className="mt-0.5 text-sm font-semibold text-ink-700">{recipe.prep_time_minutes} min</p>
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
                    : 'Nenhum alergênico marcado no seed.'}
                </p>
              </div>
            </section>

            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold tracking-[-0.025em] text-ink-900">Como preparar</h2>
                <p className="mt-3 text-sm leading-7 text-ink-700">{recipe.instructions}</p>
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
                    <h2 className="text-base font-semibold text-ink-900">Substituição demonstrativa</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-500">{recipe.substitutions}</p>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
