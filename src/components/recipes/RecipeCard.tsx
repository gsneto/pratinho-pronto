import { Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Recipe } from '../../types/domain'
import { mealTypeLabels } from '../../utils/labels'
import { RecipeVisual } from './RecipeVisual'

interface RecipeCardProps {
  recipe: Recipe
  scoreLabel?: string
}

export function RecipeCard({ recipe, scoreLabel }: RecipeCardProps) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-cream-100 bg-white shadow-[0_10px_35px_rgba(65,65,60,0.04)]">
      <RecipeVisual imageUrl={recipe.image_url} name={recipe.name} />
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-sage-50 px-2.5 py-1 text-[11px] font-semibold text-sage-700">
            {mealTypeLabels[recipe.meal_type]}
          </span>
          {recipe.is_demo && (
            <span className="rounded-full bg-terracotta-100 px-2.5 py-1 text-[11px] font-semibold text-terracotta-500">
              Demonstração
            </span>
          )}
        </div>
        <h2 className="mt-3 text-lg font-semibold tracking-[-0.025em] text-ink-900">
          {recipe.name}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-500">
          {recipe.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-ink-500">
          <span className="flex items-center gap-1.5">
            <Clock3 aria-hidden="true" size={15} />
            {recipe.prep_time_minutes} min
          </span>
          <span>A partir de {recipe.min_age_months} meses</span>
        </div>
        {scoreLabel && (
          <p className="mt-3 rounded-xl bg-sage-50 px-3 py-2 text-xs font-semibold text-sage-700">
            {scoreLabel}
          </p>
        )}
        <Link
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-cream-100 text-sm font-semibold text-sage-700"
          to={`/app/recipes/${recipe.id}`}
        >
          Ver receita
        </Link>
      </div>
    </article>
  )
}
