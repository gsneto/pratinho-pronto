import type { Ingredient, IngredientCategory, ShoppingListItem } from '../../types/domain'
import { normalizeTerm } from '../../utils/text'

export const MAX_ITEM_NAME_LENGTH = 80
export const MAX_ITEM_UNIT_LENGTH = 30

/**
 * Item "livre" é aquele sem vínculo com o catálogo: só tem um rótulo escrito
 * pela pessoa (`custom_name`) e não é derivado de nenhuma receita do cardápio.
 */
export function isManualItem(item: Pick<ShoppingListItem, 'ingredient' | 'ingredient_id'>): boolean {
  return item.ingredient_id === null && item.ingredient === null
}

/** Nome exibido: o ingrediente do catálogo ou o rótulo livre do item. */
export function shoppingItemLabel(
  item: Pick<ShoppingListItem, 'ingredient' | 'custom_name'>,
): string {
  return item.ingredient?.name ?? item.custom_name?.trim() ?? ''
}

/** Categoria para agrupar na lista: itens livres vão para "Outros". */
export function shoppingItemCategory(
  item: Pick<ShoppingListItem, 'ingredient'>,
): IngredientCategory {
  return item.ingredient?.category ?? 'other'
}

/**
 * Resolve o nome digitado para um ingrediente do catálogo, ignorando acento e
 * caixa (mesma regra da despensa e da busca de receitas). Sem correspondência,
 * o item é salvo como livre.
 */
export function resolveIngredient(name: string, ingredients: Ingredient[]): Ingredient | null {
  const term = normalizeTerm(name)
  if (!term) return null
  return ingredients.find((ingredient) => normalizeTerm(ingredient.name) === term) ?? null
}

export interface ManualItemInput {
  name: string
  quantity: number
  unit: string
}

export type ManualItemField = 'name' | 'quantity' | 'unit'
export type ManualItemErrors = Partial<Record<ManualItemField, string>>

export function validateManualItem(input: ManualItemInput): ManualItemErrors {
  const errors: ManualItemErrors = {}
  const name = input.name.trim()
  const unit = input.unit.trim()

  if (!name) errors.name = 'Escreva o nome do item.'
  else if (name.length > MAX_ITEM_NAME_LENGTH) errors.name = `Use até ${MAX_ITEM_NAME_LENGTH} caracteres.`

  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    errors.quantity = 'Informe uma quantidade maior que zero.'
  }

  if (!unit) errors.unit = 'Informe a unidade (ex.: unidade, g, colher de sopa).'
  else if (unit.length > MAX_ITEM_UNIT_LENGTH) errors.unit = `Use até ${MAX_ITEM_UNIT_LENGTH} caracteres.`

  return errors
}

export function hasManualItemErrors(errors: ManualItemErrors): boolean {
  return Object.values(errors).some(Boolean)
}

/**
 * Traduz o erro do banco ao salvar um item em uma mensagem acionável.
 *
 * Antes, qualquer falha virava "Confira a conexão", o que confundia três casos
 * bem diferentes: nome duplicado (índice único), item livre sem suporte no
 * schema (coluna ausente) e falha real de rede.
 */
export function describeItemSaveError(error: unknown): string {
  const code = (error as { code?: string } | null | undefined)?.code
  if (code === '23505') {
    return 'Já existe um item com esse nome e unidade nesta lista. Ajuste o nome ou a unidade.'
  }
  if (code === '42703' || code === 'PGRST204') {
    return 'Não foi possível salvar um item livre aqui. Escolha um nome do catálogo (a lista sugere enquanto você digita).'
  }
  return 'Não conseguimos salvar este item. Confira a conexão e tente novamente.'
}
