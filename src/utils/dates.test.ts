import { describe, expect, it } from 'vitest'
import { calculateAgeMonths, getWeekStart } from './dates'

describe('date utilities', () => {
  it('calculates age from birth date without storing a stale month count', () => {
    expect(calculateAgeMonths('2025-12-20', new Date(2026, 7, 19))).toBe(7)
    expect(calculateAgeMonths('2025-12-20', new Date(2026, 7, 20))).toBe(8)
  })

  it('returns Monday as the start of the week', () => {
    expect(getWeekStart(new Date(2026, 7, 25))).toBe('2026-08-24')
    expect(getWeekStart(new Date(2026, 7, 23))).toBe('2026-08-17')
  })
})
