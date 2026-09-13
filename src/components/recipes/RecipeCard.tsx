import { Clock3, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useFavoriteRecipe } from '../../hooks/useFavorites'
import type { Recipe } from '../../types/domain'
import { mealTypeLabels } from '../../utils/labels'
import { publicRecipeText } from '../../utils/text'
import { RecipeVisual } from './RecipeVisual'

interface RecipeCardProps {
  recipe: Recipe
  scoreLabel?: string
  missingIngredientNames?: string[]
  onAddMissing?: () => void
  isAddingMissing?: boolean
  missingActionDisabled?: boolean
  missingAdded?: boolean
  missingActionHint?: string
  returnTo?: string
}

export function RecipeCard({
  recipe,
  scoreLabel,
  missingIngredientNames,
  onAddMissing,
  isAddingMissing,
  missingActionDisabled,
  missingAdded,
  missingActionHint,
  returnTo,
}: RecipeCardProps) {
  const { isFavorite, isSaving, toggle } = useFavoriteRecipe(recipe.id)

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-cream-100 bg-white shadow-[0_10px_35px_rgba(65,65,60,0.04)]">
      <div className="relative">
        <RecipeVisual imageUrl={recipe.image_url} name={recipe.name} />
        <button
          aria-label={isFavorite ? `Remover ${recipe.name} das favoritas` : `Favoritar ${recipe.name}`}
          aria-pressed={isFavorite}
          className={`absolute top-3 right-3 grid size-11 place-items-center rounded-full shadow-sm transition ${isFavorite ? 'bg-terracotta-500 text-white' : 'bg-white/95 text-terracotta-500 hover:bg-white'}`}
          disabled={isSaving}
          onClick={toggle}
          type="button"
        >
          <Heart aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} size={19} />
        </button>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-sage-50 px-2.5 py-1 text-[11px] font-semibold text-sage-700">
            {mealTypeLabels[recipe.meal_type]}
          </span>
          {recipe.is_demo && (
            <span className="rounded-full bg-terracotta-100 px-2.5 py-1 text-[11px] font-semibold text-terracotta-500">
              Catálogo
            </span>
          )}
        </div>
        <h2 className="mt-3 text-lg font-semibold tracking-[-0.025em] text-ink-900">
          {recipe.name}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-500">
          {publicRecipeText(recipe.description)}
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
        {missingIngredientNames && missingIngredientNames.length > 0 && (
          <>
            <p className="mt-2 text-xs leading-5 text-ink-500">
              <span className="font-semibold text-ink-700">Falta comprar:</span>{' '}
              {missingIngredientNames.join(', ')}
            </p>
            {onAddMissing && (
              <>
                <button
                  className="mt-3 min-h-11 w-full rounded-xl bg-sage-50 px-3 text-xs font-semibold text-sage-700 transition hover:bg-sage-100 disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={missingActionDisabled || isAddingMissing}
                  onClick={onAddMissing}
                  type="button"
                >
                  {isAddingMissing
                    ? 'Adicionando…'
                    : missingAdded
                      ? 'Já está na sua lista'
                      : 'Adicionar faltantes à lista'}
                </button>
                {missingActionHint && (
                  <p className="mt-1.5 text-[11px] leading-4 text-ink-500">{missingActionHint}</p>
                )}
              </>
            )}
          </>
        )}
        <Link
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-cream-100 text-sm font-semibold text-sage-700 transition hover:border-sage-500"
          state={returnTo ? { returnTo } : undefined}
          to={`/app/recipes/${recipe.id}`}
        >
          Ver como preparar
        </Link>
      </div>
    </article>
  )
}
