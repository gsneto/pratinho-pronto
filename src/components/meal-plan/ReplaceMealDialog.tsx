import { Clock3, RefreshCw, X } from 'lucide-react'
import { useRef, type RefObject } from 'react'
import { useDialogFocus } from '../ui/useDialogFocus'
import { RecipeVisual } from '../recipes/RecipeVisual'
import type { MealPlanItem, Recipe } from '../../types/domain'
import { formatShortDate } from '../../utils/dates'
import { mealTypeLabels } from '../../utils/labels'

interface ReplaceMealDialogProps {
  alternatives: Recipe[]
  error?: string | null
  isSaving: boolean
  item: MealPlanItem
  onChoose: (recipe: Recipe) => void
  onClose: () => void
  returnFocusRef?: RefObject<HTMLElement | null>
}

export function ReplaceMealDialog({
  alternatives,
  error,
  isSaving,
  item,
  onChoose,
  onClose,
  returnFocusRef,
}: ReplaceMealDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useDialogFocus(true, onClose, closeRef, returnFocusRef)

  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-ink-900/45 p-3 sm:items-center sm:justify-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <section
        aria-labelledby="replace-meal-title"
        aria-modal="true"
        className="pp-modal max-h-[85vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6"
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="pp-eyebrow">Trocar somente esta refeição</p>
            <h2 className="mt-1.5 text-2xl text-ink-900" id="replace-meal-title">
              Outras ideias compatíveis
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              {mealTypeLabels[item.meal_type]} de {formatShortDate(item.date)} · agora é{' '}
              <span className="font-semibold text-ink-700">{item.recipe.name}</span>
            </p>
          </div>
          <button
            aria-label="Fechar alternativas"
            className="pp-icon-btn size-11"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        {error && <p className="pp-feedback-error" role="alert">{error}</p>}
        {alternatives.length === 0 ? (
          <div className="pp-sunken mt-6 p-5">
            <p className="text-sm font-semibold text-ink-900">
              Nenhuma outra opção compatível por aqui.
            </p>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              Todas as receitas deste tipo já estão fora das escolhas cadastradas ou da idade atual.
              Você pode revisar essas informações no perfil do bebê.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {alternatives.map((recipe) => (
              <li key={recipe.id}>
                <button
                  className="pp-card pp-interactive flex w-full items-center gap-3 p-3 text-left enabled:hover:border-sage-500 disabled:opacity-55"
                  disabled={isSaving}
                  onClick={() => onChoose(recipe)}
                  type="button"
                >
                  <RecipeVisual imageUrl={recipe.image_url} name={recipe.name} size="thumb" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold break-words text-ink-900">
                      {recipe.name}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                      <Clock3 aria-hidden="true" size={14} />
                      {recipe.prep_time_minutes} min · a partir de {recipe.min_age_months} meses
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-sage-700">
                    <RefreshCw
                      aria-hidden="true"
                      className={isSaving ? 'animate-spin motion-reduce:animate-none' : undefined}
                      size={14}
                    />
                    {isSaving ? 'Trocando…' : 'Escolher'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
