import { describe, expect, it } from 'vitest'
import { mergeShoppingListItems } from './merge'
import { formatQuantityWithUnit } from '../../utils/quantity'

describe('mergeShoppingListItems', () => {
  it('soma a quantidade quando o item já existe com a mesma unidade', () => {
    const result = mergeShoppingListItems(
      [{ ingredient_id: 'banana', quantity: 3, unit: 'unidade' }],
      [{ ingredient_id: 'banana', quantity: 1, unit: 'unidade' }],
    )
    expect(result).toEqual([{ ingredient_id: 'banana', quantity: 4, unit: 'unidade' }])
  })

  it('não substitui a quantidade existente (regressão)', () => {
    const result = mergeShoppingListItems(
      [{ ingredient_id: 'aveia', quantity: 6, unit: 'colher de sopa' }],
      [{ ingredient_id: 'aveia', quantity: 2, unit: 'colher de sopa' }],
    )
    expect(result[0]?.quantity).toBe(8)
  })

  it('mantém unidades incompatíveis em linhas separadas', () => {
    const result = mergeShoppingListItems(
      [{ ingredient_id: 'leite', quantity: 100, unit: 'ml' }],
      [{ ingredient_id: 'leite', quantity: 1, unit: 'unidade' }],
    )
    expect(result).toHaveLength(2)
  })

  it('normaliza maiúsculas e espaços ao comparar a unidade', () => {
    const result = mergeShoppingListItems(
      [{ ingredient_id: 'ovo', quantity: 1, unit: 'Unidade' }],
      [{ ingredient_id: 'ovo', quantity: 2, unit: ' unidade ' }],
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.quantity).toBe(3)
  })

  it('devolve os itens de entrada quando não há existentes', () => {
    const result = mergeShoppingListItems(
      [],
      [
        { ingredient_id: 'mamao', quantity: 0.5, unit: 'unidade' },
        { ingredient_id: 'aveia', quantity: 1, unit: 'colher de sopa' },
      ],
    )
    expect(result).toHaveLength(2)
  })

  it('a quantidade somada é exibida igual em UI e PDF (mesmo formatador)', () => {
    // A lista de compras (UI) e o PDF usam formatQuantityWithUnit; este teste
    // garante que a soma do merge chega ao usuário com a mesma string.
    const merged = mergeShoppingListItems(
      [{ ingredient_id: 'banana', quantity: 3, unit: 'unidade' }],
      [{ ingredient_id: 'banana', quantity: 1, unit: 'unidade' }],
    )
    expect(formatQuantityWithUnit(merged[0]!.quantity, merged[0]!.unit)).toBe('4 unidades')
  })
})
