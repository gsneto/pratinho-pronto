import { LoaderCircle, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

interface PageStateProps {
  action?: ReactNode
  description: string
  title: string
  variant?: 'loading' | 'error' | 'empty'
}

export function PageState({ action, description, title, variant = 'loading' }: PageStateProps) {
  const isLoading = variant === 'loading'
  const Icon = isLoading ? LoaderCircle : TriangleAlert

  return (
    <div
      aria-busy={isLoading || undefined}
      aria-live="polite"
      className="rounded-[24px] border border-cream-100 bg-white px-5 py-10 text-center shadow-[0_12px_40px_rgba(65,65,60,0.04)]"
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <span
        className={`mx-auto grid size-11 place-items-center rounded-2xl ${
          variant === 'error'
            ? 'bg-terracotta-100 text-terracotta-500'
            : 'bg-sage-50 text-sage-700'
        }`}
      >
        <Icon
          aria-hidden="true"
          className={isLoading ? 'animate-spin motion-reduce:animate-none' : undefined}
          size={21}
        />
      </span>
      <h2 className="mt-4 text-xl font-semibold tracking-[-0.025em] text-ink-900">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
