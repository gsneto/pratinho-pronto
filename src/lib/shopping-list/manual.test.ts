import { describe, expect, it } from 'vitest'
import type { Ingredient, ShoppingListItem } from '../../types/domain'
import {
  hasManualItemErrors,
  isManualItem,
  resolveIngredient,
  shoppingItemCategory,
  shoppingItemLabel,
  validateManualItem,
} from './manual'

const banana: Ingredient = { id: 'ing-banana', name: 'Banana', category: 'fruit', created_at: '' }
const acai: Ingredient = { id: 'ing-acai', name: 'Açaí', category: 'fruit', created_at: '' }

function item(overrides: Partial<ShoppingListItem>): ShoppingListItem {
  return {
    id: 'item-1',
    shopping_list_id: 'list-1',
    ingredient_id: null,
    custom_name: null,
    quantity: 1,
    unit: 'unidade',
    checked: false,
    ingredient: null,
    ...overrides,
  }
}

describe('shoppingItemLabel', () => {
  it('usa o nome do ingrediente do catálogo', () => {
    expect(shoppingItemLabel(item({ ingredient_id: banana.id, ingredient: banana }))).toBe('Banana')
  })

  it('usa o rótulo livre quando não há ingrediente', () => {
    expect(shoppingItemLabel(item({ custom_name: 'Papel toalha' }))).toBe('Papel toalha')
  })

  it('ignora espaços no rótulo livre', () => {
    expect(shoppingItemLabel(item({ custom_name: '  Fraldas  ' }))).toBe('Fraldas')
  })
})

describe('shoppingItemCategory', () => {
  it('usa a categoria do ingrediente', () => {
    expect(shoppingItemCategory(item({ ingredient: banana }))).toBe('fruit')
  })

  it('joga itens livres em "Outros"', () => {
    expect(shoppingItemCategory(item({ custom_name: 'Fraldas' }))).toBe('other')
  })
})

describe('isManualItem', () => {
  it('é manual apenas quando não há vínculo com o catálogo', () => {
    expect(isManualItem(item({ custom_name: 'Fraldas' }))).toBe(true)
    expect(isManualItem(item({ ingredient_id: banana.id, ingredient: banana }))).toBe(false)
  })
})

describe('resolveIngredient', () => {
  it('resolve ignorando acento e caixa', () => {
    expect(resolveIngredient('acai', [banana, acai])?.id).toBe(acai.id)
    expect(resolveIngredient('BANANA', [banana, acai])?.id).toBe(banana.id)
  })

  it('devolve nulo quando não há correspondência', () => {
    expect(resolveIngredient('papel toalha', [banana, acai])).toBeNull()
    expect(resolveIngredient('   ', [banana])).toBeNull()
  })
})

describe('validateManualItem', () => {
  it('aceita um item válido', () => {
    expect(hasManualItemErrors(validateManualItem({ name: 'Banana', quantity: 2, unit: 'unidade' }))).toBe(false)
  })

  it('exige nome', () => {
    expect(validateManualItem({ name: '   ', quantity: 1, unit: 'unidade' }).name).toBeTruthy()
  })

  it('exige quantidade maior que zero', () => {
    expect(validateManualItem({ name: 'Banana', quantity: 0, unit: 'unidade' }).quantity).toBeTruthy()
    expect(validateManualItem({ name: 'Banana', quantity: Number.NaN, unit: 'unidade' }).quantity).toBeTruthy()
  })

  it('exige unidade', () => {
    expect(validateManualItem({ name: 'Banana', quantity: 1, unit: '  ' }).unit).toBeTruthy()
  })

  it('limita o tamanho do nome e da unidade', () => {
    expect(validateManualItem({ name: 'x'.repeat(81), quantity: 1, unit: 'unidade' }).name).toBeTruthy()
    expect(validateManualItem({ name: 'Banana', quantity: 1, unit: 'u'.repeat(31) }).unit).toBeTruthy()
  })
})
