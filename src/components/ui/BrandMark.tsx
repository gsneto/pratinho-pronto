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
        <img
          alt="Pratinho Pronto"
          className="h-12 w-auto max-w-[220px] object-contain object-left"
          decoding="async"
          height={724}
          src="/brand/pratinho-pronto-logo.png"
          width={2172}
        />
      )}
    </div>
  )
}
