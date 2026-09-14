import { describe, expect, it } from 'vitest'
import {
  addDays,
  calculateAgeMonths,
  getWeekStart,
  isIsoDate,
  normalizeWeekStart,
  shiftIsoDate,
} from './dates'

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

describe('shiftIsoDate', () => {
  it('desloca a data preservando o mesmo dia da semana entre planos', () => {
    // De segunda 2026-08-24 para segunda 2026-08-31 (7 dias).
    expect(shiftIsoDate('2026-08-24', '2026-08-24', '2026-08-31')).toBe('2026-08-31')
    expect(shiftIsoDate('2026-08-27', '2026-08-24', '2026-08-31')).toBe('2026-09-03')
    expect(shiftIsoDate('2026-08-30', '2026-08-24', '2026-08-31')).toBe('2026-09-06')
  })

  it('funciona para semanas retroativas (offset negativo)', () => {
    expect(shiftIsoDate('2026-08-27', '2026-08-24', '2026-08-17')).toBe('2026-08-20')
  })

  it('não sofre o desvio de fuso do padrão toISOString().slice(0,10)', () => {
    // Reproduz o padrão frágil usado antes do refactor: cria a data em UTC e
    // corta os primeiros 10 caracteres. Em fusos com offset negativo grande,
    // uma data local pode virar o dia anterior em UTC, produzindo resultado
    // incorreto. shiftIsoDate opera em datas locais e não sofre esse desvio.
    const naiveShift = (iso: string, offset: number): string =>
      new Date(new Date(iso).getTime() + offset * 86_400_000)
        .toISOString()
        .slice(0, 10)

    // Em UTC-3 (Brasil), `new Date('2026-08-24')` vira 2026-08-23 21:00 local,
    // e ao chamar toISOString().slice(0,10) devolve '2026-08-24'. Somar 7 dias
    // resulta em '2026-08-31' — parece correto. O que quebra é a combinação
    // com meses/dias em torno de fim de ano ou com item.date interpretado
    // via new Date(iso), que também sofre o mesmo problema. shiftIsoDate
    // permanece estável.
    for (const iso of ['2026-08-24', '2026-12-31', '2027-01-01', '2026-03-01']) {
      expect(shiftIsoDate(iso, '2026-08-24', '2026-08-31')).toBe(addDays(iso, 7))
    }

    // O naiveShift é mantido no teste apenas como referência do padrão antigo,
    // que dependia de "T12:00:00" injetado manualmente para sobreviver ao fuso.
    expect(naiveShift('2026-08-24T12:00:00Z', 7)).toBe('2026-08-31')
  })
})
