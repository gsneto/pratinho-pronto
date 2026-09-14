import { CalendarDays, ChevronLeft, ChevronRight, FileDown, ListChecks, Printer, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { RecipeVisual } from '../components/recipes/RecipeVisual'
import {
  previewAlternatives,
  previewMealTypeLabels,
  type PreviewMeal,
} from './fixtures'

/**
 * Peças compartilhadas pelas três propostas: navegação de semana, ações de
 * saída (lista e PDF) e o diálogo de troca. São iguais nas três variações para
 * que a comparação recaia sobre composição, foto, densidade e hierarquia.
 */

interface WeekNavProps {
  /** 'compact' na proposta B, 'wide' nas propostas A e C. */
  layout?: 'compact' | 'wide'
  onNavigate: (direction: -1 | 1) => void
  weekLabel: string
  isCurrentWeek: boolean
  onBackToCurrent: () => void
}

export function PreviewWeekNav({
  layout = 'wide',
  onNavigate,
  weekLabel,
  isCurrentWeek,
  onBackToCurrent,
}: WeekNavProps) {
  return (
    <div
      aria-label="Semana exibida"
      className={`flex items-center gap-2 ${layout === 'wide' ? 'sm:gap-3' : ''}`}
      role="group"
    >
      <button
        aria-label="Ver semana anterior"
        className="pp-icon-btn size-12"
        onClick={() => onNavigate(-1)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={20} />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-900">
          <CalendarDays aria-hidden="true" className="text-sage-700" size={15} />
          {weekLabel}
        </p>
        {isCurrentWeek ? (
          <p className="mt-0.5 text-xs font-semibold text-sage-700">Semana de hoje</p>
        ) : (
          <button className="pp-link mt-0.5 text-xs" onClick={onBackToCurrent} type="button">
            Voltar para esta semana
          </button>
        )}
      </div>
      <button
        aria-label="Ver próxima semana"
        className="pp-icon-btn size-12"
        onClick={() => onNavigate(1)}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={20} />
      </button>
    </div>
  )
}

interface PreviewExportsProps {
  /** 'row' aproveita largura em telas grandes; 'stack' fica melhor em coluna. */
  layout?: 'row' | 'stack'
}

export function PreviewExports({ layout = 'row' }: PreviewExportsProps) {
  return (
    <section
      aria-label="Sair da semana com lista e PDF"
      className={`pp-panel-quiet p-4 sm:p-5 ${
        layout === 'row' ? 'grid gap-3 sm:grid-cols-3' : 'grid gap-3'
      }`}
    >
      <button className="pp-btn pp-btn-primary w-full" type="button">
        <ListChecks aria-hidden="true" size={18} />
        Gerar lista de compras
      </button>
      <button className="pp-btn pp-btn-secondary w-full" type="button">
        <Printer aria-hidden="true" size={18} />
        Imprimir cardápio
      </button>
      <button className="pp-btn pp-btn-secondary w-full" type="button">
        <FileDown aria-hidden="true" size={18} />
        Receitas em PDF
      </button>
    </section>
  )
}

interface PreviewReplaceDialogProps {
  meal: PreviewMeal
  onClose: () => void
}

export function PreviewReplaceDialog({ meal, onClose }: PreviewReplaceDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  // Guarda o gatilho ANTES de mover o foco para o botão de fechar, para que
  // Esc devolva o foco ao botão "Trocar" original em vez de sumir no body.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      onClose()
      previouslyFocusedRef.current?.focus()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-ink-900/45 p-3 sm:items-center sm:justify-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <section
        aria-labelledby="preview-replace-title"
        aria-modal="true"
        className="pp-modal max-h-[86vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="pp-eyebrow">Trocar somente esta refeição</p>
            <h2 className="mt-1.5 text-2xl text-ink-900" id="preview-replace-title">
              Outras ideias compatíveis
            </h2>
            <p className="mt-2 text-sm text-ink-500">
              {previewMealTypeLabels[meal.mealType]} · agora é {meal.recipeName}
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
        <ul className="mt-5 space-y-3">
          {previewAlternatives.map((alternative) => (
            <li key={alternative.id}>
              <button
                className="pp-card pp-interactive flex w-full items-center gap-3 p-3 text-left"
                onClick={onClose}
                type="button"
              >
                <RecipeVisual imageUrl={null} name={alternative.recipeName} size="thumb" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold break-words text-ink-900">
                    {alternative.recipeName}
                  </span>
                  <span className="mt-1 block text-xs text-ink-500">
                    {alternative.prepTimeMinutes} min · {alternative.texture}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-sage-700">Escolher</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
