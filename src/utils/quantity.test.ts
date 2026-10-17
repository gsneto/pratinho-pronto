import { describe, expect, it } from 'vitest'
import { formatQuantity, formatQuantityWithUnit } from './quantity'

describe('formatQuantity', () => {
  it('formats numbers in pt-BR', () => {
    expect(formatQuantity(1)).toBe('1')
    expect(formatQuantity(0.5)).toBe('0,5')
    expect(formatQuantity(160)).toBe('160')
  })
})

describe('formatQuantityWithUnit', () => {
  it('keeps countable units singular for one and plural above one', () => {
    expect(formatQuantityWithUnit(1, 'unidade')).toBe('1 unidade')
    expect(formatQuantityWithUnit(3, 'unidade')).toBe('3 unidades')
    expect(formatQuantityWithUnit(2, 'fatia')).toBe('2 fatias')
  })

  it('pluralizes only the noun of compound spoon units', () => {
    expect(formatQuantityWithUnit(1, 'colher de sopa')).toBe('1 colher de sopa')
    expect(formatQuantityWithUnit(6, 'colher de sopa')).toBe('6 colheres de sopa')
    expect(formatQuantityWithUnit(2, 'colher de chá')).toBe('2 colheres de chá')
  })

  it('keeps fractional amounts singular', () => {
    expect(formatQuantityWithUnit(0.5, 'unidade')).toBe('0,5 unidade')
  })

  it('leaves invariable units untouched', () => {
    expect(formatQuantityWithUnit(160, 'g')).toBe('160 g')
    expect(formatQuantityWithUnit(300, 'ml')).toBe('300 ml')
  })

  it('normalizes case and spacing for known units', () => {
    expect(formatQuantityWithUnit(2, ' Unidade ')).toBe('2 unidades')
  })

  it('resolves unit aliases before pluralizing', () => {
    expect(formatQuantityWithUnit(3, 'un')).toBe('3 unidades')
    expect(formatQuantityWithUnit(1, 'unidades')).toBe('1 unidade')
    expect(formatQuantityWithUnit(2, 'colheres de sopa')).toBe('2 colheres de sopa')
  })
})
