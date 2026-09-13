import { describe, expect, it } from 'vitest'
import { calculateAgeMonths, getWeekStart, isIsoDate, normalizeWeekStart } from './dates'

describe('date utilities', () => {
  it('calculates age from birth date without storing a stale month count', () => {
    expect(calculateAgeMonths('2025-12-20', new Date(2026, 7, 19))).toBe(7)
    expect(calculateAgeMonths('2025-12-20', new Date(2026, 7, 20))).toBe(8)
  })

  it('returns Monday as the start of the week', () => {
    expect(getWeekStart(new Date(2026, 7, 25))).toBe('2026-08-24')
    expect(getWeekStart(new Date(2026, 7, 23))).toBe('2026-08-17')
  })

  it('recognises only real ISO dates', () => {
    expect(isIsoDate('2026-08-24')).toBe(true)
    expect(isIsoDate('2026-02-31')).toBe(false)
    expect(isIsoDate('24/08/2026')).toBe(false)
    expect(isIsoDate(null)).toBe(false)
  })

  it('normalises any day of the week to its Monday', () => {
    expect(normalizeWeekStart('2026-08-24')).toBe('2026-08-24')
    expect(normalizeWeekStart('2026-08-27')).toBe('2026-08-24')
    expect(normalizeWeekStart('2026-08-23')).toBe('2026-08-17')
  })

  it('falls back to the current week when the value is unusable', () => {
    expect(normalizeWeekStart(null)).toBe(getWeekStart())
    expect(normalizeWeekStart('semana-que-vem')).toBe(getWeekStart())
  })
})
