import { FileDown, LoaderCircle, Printer } from 'lucide-react'
import { useState } from 'react'
import { analytics } from '../../services/analytics'
import type { Baby, MealPlan, ShoppingList } from '../../types/domain'
import type { PdfKind } from './createPdf'

interface PdfExportButtonProps {
  baby: Baby
  kind: PdfKind
  label: string
  plan?: MealPlan
  shoppingList?: ShoppingList
}

function safeFilename(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export function PdfExportButton({
  baby,
  kind,
  label,
  plan,
  shoppingList,
}: PdfExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(false)

  async function handleExport() {
    setIsGenerating(true)
    setError(false)
    try {
      const { createPdfBlob } = await import('./createPdf')
      const blob = await createPdfBlob({ baby, kind, plan, shoppingList })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${safeFilename(label)}-${safeFilename(baby.name)}.pdf`
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      analytics.track('pdf_generated', { kind })
    } catch {
      setError(true)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div>
      <button
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-sage-500 bg-white px-4 text-sm font-semibold text-sage-700 disabled:opacity-55"
        disabled={isGenerating}
        onClick={handleExport}
        type="button"
      >
        {isGenerating ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
        ) : kind === 'week' ? (
          <Printer aria-hidden="true" size={18} />
        ) : (
          <FileDown aria-hidden="true" size={18} />
        )}
        {isGenerating ? 'Gerando PDF…' : label}
      </button>
      {error && <p className="mt-2 text-xs text-terracotta-500">Não foi possível gerar o PDF.</p>}
    </div>
  )
}
