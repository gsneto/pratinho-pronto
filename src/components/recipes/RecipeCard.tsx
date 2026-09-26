import { ArrowRight, Clock3, Heart } from 'lucide-react'
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
    <article className="pp-card pp-recipe-card flex flex-col overflow-hidden">
      <div className="relative">
        <Link aria-label={`Ver receita: ${recipe.name}`} to={`/app/recipes/${recipe.id}`} state={returnTo ? { returnTo } : undefined}>
          <RecipeVisual imageUrl={recipe.image_url} name={recipe.name} size="card" />
        </Link>
        <button
          aria-label={isFavorite ? `Remover ${recipe.name} das favoritas` : `Favoritar ${recipe.name}`}
          aria-pressed={isFavorite}
          className={`absolute top-3 right-3 grid size-11 place-items-center rounded-full shadow-sm transition-colors disabled:opacity-55 ${
            isFavorite
              ? 'bg-terracotta-500 text-white'
              : 'bg-white/95 text-terracotta-500 hover:bg-white'
          }`}
          disabled={isSaving}
          onClick={toggle}
          type="button"
        >
          <Heart aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} size={19} />
        </button>
      </div>
      <div className="pp-recipe-card-body">
        <div className="flex flex-wrap gap-2">
          <span className="pp-badge pp-badge-sage">{mealTypeLabels[recipe.meal_type]}</span>
          {recipe.is_demo && <span className="pp-badge pp-badge-terracotta">Demonstrativa</span>}
        </div>
        <Link className="pp-recipe-title-link" state={returnTo ? { returnTo } : undefined} to={`/app/recipes/${recipe.id}`}><h2 className="leading-snug break-words text-ink-900">{recipe.name}</h2></Link>
        <p className="pp-recipe-description mt-2 line-clamp-2 text-sm leading-6 text-ink-500">
          {publicRecipeText(recipe.description)}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-ink-500">
          <span className="flex items-center gap-1.5">
            <Clock3 aria-hidden="true" size={15} />
            {recipe.prep_time_minutes} min
          </span>
          <span>{recipe.min_age_months}+ meses</span>
        </div>
        {scoreLabel && (
          <p className="pp-badge pp-badge-sage mt-3 w-full justify-start rounded-[14px] px-3 py-2 leading-5">
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
                  className="pp-btn pp-btn-quiet pp-btn-sm mt-3 w-full"
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
        <div className="pp-recipe-footer">
          <Link
            className="pp-text-action"
            state={returnTo ? { returnTo } : undefined}
            to={`/app/recipes/${recipe.id}`}
          >
            Ver preparo <ArrowRight aria-hidden="true" size={16} />
                      </Link>
        </div>
      </div>
    </article>
  )
}
