import { LoaderCircle, TriangleAlert } from 'lucide-react'

interface PageStateProps {
  description: string
  title: string
  variant?: 'loading' | 'error' | 'empty'
}

export function PageState({ description, title, variant = 'loading' }: PageStateProps) {
  const isLoading = variant === 'loading'
  const Icon = isLoading ? LoaderCircle : TriangleAlert

  return (
    <div className="rounded-[24px] border border-cream-100 bg-white px-5 py-10 text-center shadow-[0_12px_40px_rgba(65,65,60,0.04)]">
      <span
        className={`mx-auto grid size-11 place-items-center rounded-2xl ${
          variant === 'error'
            ? 'bg-terracotta-100 text-terracotta-500'
            : 'bg-sage-50 text-sage-700'
        }`}
      >
        <Icon
          aria-hidden="true"
          className={isLoading ? 'animate-spin' : undefined}
          size={21}
        />
      </span>
      <h2 className="mt-4 text-xl font-semibold tracking-[-0.025em] text-ink-900">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">
        {description}
      </p>
    </div>
  )
}
