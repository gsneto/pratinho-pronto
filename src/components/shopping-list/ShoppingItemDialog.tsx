import { Trash2, X } from 'lucide-react'
import { useId, useRef, useState, type RefObject } from 'react'
import type { Ingredient, ShoppingListItem } from '../../types/domain'
import { useDialogFocus } from '../ui/useDialogFocus'
import {
  hasManualItemErrors,
  isManualItem,
  resolveIngredient,
  shoppingItemLabel,
  validateManualItem,
  type ManualItemErrors,
} from '../../lib/shopping-list/manual'

const unitSuggestions = [
  'unidade',
  'g',
  'ml',
  'colher de sopa',
  'colher de chá',
  'fatia',
  'xícara',
  'pote',
  'porção',
]

export interface ShoppingItemSubmit {
  name: string
  quantity: number
  unit: string
  ingredientId: string | null
}

interface ShoppingItemDialogProps {
  mode: 'add' | 'edit'
  item?: ShoppingListItem
  ingredients: Ingredient[]
  isSaving: boolean
  error: string | null
  onSubmit: (values: ShoppingItemSubmit) => void
  onRemove?: () => void
  onClose: () => void
  returnFocusRef?: RefObject<HTMLElement | null>
}

/**
 * Diálogo de item da lista de compras: adiciona um item pelo nome ou edita um
 * existente. Um nome que coincide com o catálogo vira um item do catálogo;
 * qualquer outro nome vira um item livre.
 */
export function ShoppingItemDialog({
  mode,
  item,
  ingredients,
  isSaving,
  error,
  onSubmit,
  onRemove,
  onClose,
  returnFocusRef,
}: ShoppingItemDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useDialogFocus(true, onClose, closeRef, returnFocusRef)
  const id = useId()
  const titleId = `${id}-title`
  const nameId = `${id}-name`
  const quantityId = `${id}-quantity`
  const unitId = `${id}-unit`

  const editingCatalogItem = mode === 'edit' && item ? !isManualItem(item) : false
  const [name, setName] = useState(mode === 'edit' && item ? shoppingItemLabel(item) : '')
  const [quantity, setQuantity] = useState(
    mode === 'edit' && item ? String(item.quantity) : '1',
  )
  const [unit, setUnit] = useState(mode === 'edit' && item ? item.unit : 'unidade')
  const [errors, setErrors] = useState<ManualItemErrors>({})

  function handleSubmit() {
    const parsed = Number(quantity.replace(',', '.'))
    const nextErrors = validateManualItem({ name, quantity: parsed, unit })
    setErrors(nextErrors)
    if (hasManualItemErrors(nextErrors)) return

    // Item do catálogo: mantém o vínculo existente. Item livre: resolve o nome
    // no catálogo quando possível, senão permanece livre.
    const resolved = resolveIngredient(name, ingredients)
    onSubmit({
      name: name.trim(),
      quantity: parsed,
      unit: unit.trim(),
      ingredientId: editingCatalogItem ? (item?.ingredient_id ?? null) : (resolved?.id ?? null),
    })
  }

  const busy = isSaving

  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-ink-900/45 p-3 sm:items-center sm:justify-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="pp-modal max-h-[88vh] w-full max-w-md overflow-y-auto p-5 sm:p-6"
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="mt-1.5 text-xl break-words text-ink-900" id={titleId}>
            {mode === 'add' ? 'Adicionar item' : 'Editar item'}
          </h2>
          <button
            aria-label="Fechar"
            className="pp-icon-btn size-11"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <p className="mt-2 text-sm leading-6 text-ink-500">
          Some o que você já tem em casa. Um nome do catálogo entra ligado às receitas; um nome
          novo fica como item livre da sua lista.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            {editingCatalogItem ? (
              <>
                <span className="pp-field-label">Nome do item</span>
                <p className="mt-1.5 text-sm text-ink-700">{name}</p>
              </>
            ) : (
              <>
                <label className="pp-field-label" htmlFor={nameId}>
                  Nome do item
                </label>
                <input
                  aria-describedby={errors.name ? `${nameId}-error` : undefined}
                  aria-invalid={errors.name ? 'true' : undefined}
                  className="pp-field mt-1.5"
                  id={nameId}
                  list={`${id}-ingredients`}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Banana, aveia, papel toalha…"
                  value={name}
                />
                <datalist id={`${id}-ingredients`}>
                  {ingredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.name} />
                  ))}
                </datalist>
                {errors.name && (
                  <p className="mt-2 text-sm text-terracotta-500" id={`${nameId}-error`} role="alert">
                    {errors.name}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="pp-field-label" htmlFor={quantityId}>
                Quantidade
              </label>
              <input
                aria-describedby={errors.quantity ? `${quantityId}-error` : undefined}
                aria-invalid={errors.quantity ? 'true' : undefined}
                className="pp-field mt-1.5"
                id={quantityId}
                inputMode="decimal"
                min="0"
                onChange={(event) => setQuantity(event.target.value)}
                step="0.5"
                type="number"
                value={quantity}
              />
              {errors.quantity && (
                <p className="mt-2 text-sm text-terracotta-500" id={`${quantityId}-error`} role="alert">
                  {errors.quantity}
                </p>
              )}
            </div>
            <div>
              <label className="pp-field-label" htmlFor={unitId}>
                Unidade
              </label>
              <input
                aria-describedby={errors.unit ? `${unitId}-error` : undefined}
                aria-invalid={errors.unit ? 'true' : undefined}
                className="pp-field mt-1.5"
                id={unitId}
                list={`${id}-units`}
                onChange={(event) => setUnit(event.target.value)}
                value={unit}
              />
              <datalist id={`${id}-units`}>
                {unitSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              {errors.unit && (
                <p className="mt-2 text-sm text-terracotta-500" id={`${unitId}-error`} role="alert">
                  {errors.unit}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="pp-feedback-error" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            className="pp-btn pp-btn-primary flex-1"
            disabled={busy}
            onClick={handleSubmit}
            type="button"
          >
            {isSaving ? 'Salvando…' : mode === 'add' ? 'Adicionar à lista' : 'Salvar item'}
          </button>
          <button className="pp-btn pp-btn-secondary" disabled={busy} onClick={onClose} type="button">
            Cancelar
          </button>
        </div>

        {mode === 'edit' && onRemove && (
          <button
            className="pp-text-action mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-terracotta-500"
            disabled={busy}
            onClick={onRemove}
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
            Remover item da lista
          </button>
        )}
      </section>
    </div>
  )
}
