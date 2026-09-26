import { UtensilsCrossed } from 'lucide-react'

interface BrandMarkProps {
  compact?: boolean
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div aria-label="Pratinho Pronto" className="flex items-center gap-2.5" role="img">
      {compact ? (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#2A2A22] shadow-[0_5px_16px_rgba(42,42,34,0.16)]">
          <UtensilsCrossed aria-hidden="true" className="text-sage-500" size={21} strokeWidth={2.1} />
        </span>
      ) : (
        <span className="flex h-[72px] w-[180px] shrink-0 items-center overflow-hidden sm:w-[200px]">
          <img
            alt="Pratinho Pronto"
            className="brand-logo-light h-full w-full object-contain"
            decoding="async"
            height={941}
            src="/brand/pratinho-pronto-logo.png"
            width={1672}
          />
          <img
            alt=""
            aria-hidden="true"
            className="brand-logo-dark h-full w-full object-contain"
            decoding="async"
            height={941}
            src="/brand/pratinho-pronto-logo-dark-v2.png"
            width={1672}
          />
        </span>
      )}
    </div>
  )
}
