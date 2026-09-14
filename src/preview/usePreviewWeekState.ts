import { useState } from 'react'
import type { PreviewMeal } from './fixtures'
import { previewWeek } from './fixtures'

/** Estado comum às três propostas: semana visível e refeição em troca. */
export function usePreviewWeekState() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [replacingMeal, setReplacingMeal] = useState<PreviewMeal | null>(null)

  const isCurrentWeek = weekOffset === 0
  const weekLabel = isCurrentWeek
    ? previewWeek.shortLabel
    : `Semana ${weekOffset > 0 ? '+' : '−'}${Math.abs(weekOffset)}`

  return {
    isCurrentWeek,
    onBackToCurrent: () => setWeekOffset(0),
    onNavigate: (direction: -1 | 1) => setWeekOffset((current) => current + direction),
    replacingMeal,
    setReplacingMeal,
    weekLabel,
  }
}
