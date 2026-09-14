import { CircleCheck, Inbox, LoaderCircle, TriangleAlert } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

type PageStateVariant = 'loading' | 'error' | 'empty' | 'success'

interface PageStateProps {
  action?: ReactNode
  description: string
  /** Ícone opcional para dar contexto ao estado vazio de uma tela específica. */
  icon?: ComponentType<{ 'aria-hidden'?: boolean | 'true' | 'false'; size?: number }>
  title: string
  variant?: PageStateVariant
}

const iconByVariant: Record<PageStateVariant, typeof LoaderCircle> = {
  empty: Inbox,
  error: TriangleAlert,
  loading: LoaderCircle,
  success: CircleCheck,
}

/**
 * Estado único de tela: carregando, erro, vazio e sucesso.
 * A diferença nunca é apenas de cor — muda o ícone, o texto e a ação sugerida.
 */
export function PageState({
  action,
  description,
  icon,
  title,
  variant = 'loading',
}: PageStateProps) {
  const isLoading = variant === 'loading'
  const Icon = icon ?? iconByVariant[variant]

  return (
    <div
      aria-busy={isLoading || undefined}
      aria-live="polite"
      className="pp-panel px-5 py-10 text-center sm:px-8 sm:py-12"
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <span
        className={`mx-auto grid size-12 place-items-center rounded-[14px] ${
          variant === 'error'
            ? 'bg-terracotta-100 text-terracotta-500'
            : 'bg-sage-50 text-sage-700'
        }`}
      >
        <Icon
          aria-hidden="true"
          className={isLoading ? 'animate-spin motion-reduce:animate-none' : undefined}
          size={22}
        />
      </span>
      <h2 className="mt-4 text-xl text-ink-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}
