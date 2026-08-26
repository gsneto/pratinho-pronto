import { Utensils } from 'lucide-react'

interface BrandMarkProps {
  compact?: boolean
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3" aria-label="Pratinho Pronto">
      <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-sage-100 text-sage-700">
        <Utensils aria-hidden="true" size={20} strokeWidth={1.8} />
      </span>
      {!compact && (
        <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink-900">
          Pratinho Pronto
        </span>
      )}
    </div>
  )
}
