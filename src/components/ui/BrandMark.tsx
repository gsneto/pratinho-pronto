import { UtensilsCrossed } from 'lucide-react'

interface BrandMarkProps {
  compact?: boolean
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div aria-label="Pratinho Pronto" className="flex items-center gap-2.5" role="img">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#2A2A22] shadow-[0_5px_16px_rgba(42,42,34,0.16)]">
        <UtensilsCrossed aria-hidden="true" className="text-sage-500" size={21} strokeWidth={2.1} />
      </span>
      {!compact && (
        <span className="text-[18px] font-semibold tracking-[-0.035em] text-ink-900">
          Pratinho <span className="text-terracotta-500">Pronto</span>
        </span>
      )}
    </div>
  )
}
