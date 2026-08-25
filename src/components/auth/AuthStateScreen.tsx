import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { BrandMark } from '../ui/BrandMark'

interface AuthStateScreenProps {
  description?: string
  title?: string
  variant?: 'loading' | 'error'
}

export function AuthStateScreen({
  description = 'Estamos recuperando sua sessão com segurança.',
  title = 'Só um instante…',
  variant = 'loading',
}: AuthStateScreenProps) {
  const Icon = variant === 'loading' ? LoaderCircle : TriangleAlert

  return (
    <main className="grid min-h-screen place-items-center bg-cream-50 px-5">
      <div className="w-full max-w-sm rounded-[26px] border border-cream-100 bg-white p-7 text-center shadow-[0_18px_50px_rgba(65,65,60,0.06)]">
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <span
          className={`mx-auto mt-7 grid size-12 place-items-center rounded-2xl ${
            variant === 'loading'
              ? 'bg-sage-50 text-sage-700'
              : 'bg-terracotta-100 text-terracotta-500'
          }`}
        >
          <Icon
            aria-hidden="true"
            className={variant === 'loading' ? 'animate-spin' : undefined}
            size={22}
          />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.035em] text-ink-900">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p>
      </div>
    </main>
  )
}
