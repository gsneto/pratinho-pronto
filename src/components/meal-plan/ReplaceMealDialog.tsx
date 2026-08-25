import { Clock3, X } from 'lucide-react'
import type { MealPlanItem, Recipe } from '../../types/domain'

interface ReplaceMealDialogProps {
  alternatives: Recipe[]
  isSaving: boolean
  item: MealPlanItem
  onChoose: (recipe: Recipe) => void
  onClose: () => void
}

export function ReplaceMealDialog({
  alternatives,
  isSaving,
  item,
  onChoose,
  onClose,
}: ReplaceMealDialogProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-ink-900/35 p-3 sm:items-center sm:justify-center" role="presentation">
      <section
        aria-labelledby="replace-meal-title"
        aria-modal="true"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[26px] bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-terracotta-500">Trocar somente esta refeição</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-ink-900" id="replace-meal-title">
              Outras ideias compatíveis
            </h2>
            <p className="mt-2 text-sm text-ink-500">Atual: {item.recipe.name}</p>
          </div>
          <button
            aria-label="Fechar alternativas"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream-50 text-ink-700"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        {alternatives.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-cream-50 p-5 text-sm leading-6 text-ink-500">
            Não encontramos outra receita do mesmo tipo compatível com o cadastro.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {alternatives.map((recipe) => (
              <button
                className="flex min-h-18 w-full items-center justify-between gap-4 rounded-2xl border border-cream-100 p-4 text-left enabled:hover:border-sage-500 disabled:opacity-55"
                disabled={isSaving}
                key={recipe.id}
                onClick={() => onChoose(recipe)}
                type="button"
              >
                <span>
                  <span className="block text-sm font-semibold text-ink-900">{recipe.name}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                    <Clock3 aria-hidden="true" size={14} />
                    {recipe.prep_time_minutes} min
                  </span>
                </span>
                <span className="text-xs font-semibold text-sage-700">Escolher</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
