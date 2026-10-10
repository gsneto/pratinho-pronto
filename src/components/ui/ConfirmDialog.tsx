import { X } from 'lucide-react'
import { useId, useRef, type RefObject } from 'react'
import { useDialogFocus } from './useDialogFocus'

interface ConfirmDialogProps {
  cancelLabel?: string
  confirmLabel: string
  description: string
  details?: string[]
  isConfirming?: boolean
  onClose: () => void
  onConfirm: () => void
  returnFocusRef?: RefObject<HTMLElement | null>
  title: string
}

/**
 * Diálogo de confirmação para ações que substituem dados. Segue o padrão dos
 * modais existentes (foco preso, Escape fecha, retorno de foco ao gatilho).
 */
export function ConfirmDialog({
  cancelLabel = 'Cancelar',
  confirmLabel,
  description,
  details = [],
  isConfirming = false,
  onClose,
  onConfirm,
  returnFocusRef,
  title,
}: ConfirmDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useDialogFocus(true, onClose, closeRef, returnFocusRef)
  const id = useId()
  const titleId = `${id}-confirm-title`

  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-ink-900/45 p-3 sm:items-center sm:justify-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="pp-modal max-h-[85vh] w-full max-w-md overflow-y-auto p-5 sm:p-6"
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="mt-1.5 text-xl break-words text-ink-900" id={titleId}>{title}</h2>
          <button
            aria-label="Fechar"
            className="pp-icon-btn size-11"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-ink-500">{description}</p>
        {details.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm leading-6 text-ink-700">
            {details.map((detail) => (
              <li className="flex gap-2" key={detail}>
                <span aria-hidden="true">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            className="pp-btn pp-btn-primary"
            disabled={isConfirming}
            onClick={onConfirm}
            type="button"
          >
            {isConfirming ? 'Atualizando…' : confirmLabel}
          </button>
          <button
            className="pp-btn pp-btn-secondary"
            disabled={isConfirming}
            onClick={onClose}
            type="button"
          >
            {cancelLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
