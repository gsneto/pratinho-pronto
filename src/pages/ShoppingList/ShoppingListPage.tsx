import { useQueryClient } from '@tanstack/react-query'
import { Check, ListChecks, Pencil, Plus, ShoppingCart } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import {
  ShoppingItemDialog,
  type ShoppingItemSubmit,
} from '../../components/shopping-list/ShoppingItemDialog'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { PageState } from '../../components/ui/PageState'
import { useBaby } from '../../hooks/useBaby'
import { useMealPlan } from '../../hooks/useMealPlan'
import { useIngredients } from '../../hooks/useRecipes'
import { shoppingListQueryKey, useShoppingList } from '../../hooks/useShoppingList'
import { analytics } from '../../services/analytics'
import {
  addShoppingListItem,
  generateShoppingList,
  removeShoppingListItem,
  setShoppingItemChecked,
  updateShoppingListItem,
  type ShoppingListItemPatch,
} from '../../services/shoppingLists'
import {
  isManualItem,
  describeItemSaveError,
  shoppingItemCategory,
  shoppingItemLabel,
} from '../../lib/shopping-list/manual'
import type { IngredientCategory, ShoppingListItem } from '../../types/domain'
import { addDays, formatShortDate, getWeekStart, normalizeWeekStart } from '../../utils/dates'
import { compareIngredientCategories, ingredientCategoryLabels } from '../../utils/labels'
import { formatQuantityWithUnit } from '../../utils/quantity'

type ItemDialogState = { mode: 'add' } | { mode: 'edit'; item: ShoppingListItem }

export function ShoppingListPage() {
  const queryClient = useQueryClient()
  const { data: baby } = useBaby()
  const { data: ingredients = [] } = useIngredients()
  const [searchParams] = useSearchParams()
  const weekStart = normalizeWeekStart(searchParams.get('week'))
  const weekRangeLabel = `${formatShortDate(weekStart)} a ${formatShortDate(addDays(weekStart, 6))}`
  const isThisWeek = weekStart === getWeekStart()
  const { data: plan, error: planError, isLoading: planLoading } = useMealPlan(
    baby?.id,
    weekStart,
  )
  const { data: shoppingList, error: listError, isLoading: listLoading } =
    useShoppingList(plan?.id)
  const [isGenerating, setIsGenerating] = useState(false)
  const [changingItemId, setChangingItemId] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [itemError, setItemError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [itemDialog, setItemDialog] = useState<ItemDialogState | null>(null)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [itemDialogError, setItemDialogError] = useState<string | null>(null)
  const confirmTriggerRef = useRef<HTMLButtonElement>(null)
  const itemDialogTriggerRef = useRef<HTMLButtonElement>(null)

  const groupedItems = useMemo(() => {
    const groups = new Map<IngredientCategory, ShoppingListItem[]>()
    shoppingList?.shopping_list_items
      .slice()
      .sort((a, b) => shoppingItemLabel(a).localeCompare(shoppingItemLabel(b), 'pt-BR'))
      .forEach((item) => {
        const category = shoppingItemCategory(item)
        groups.set(category, [...(groups.get(category) ?? []), item])
      })
    return [...groups.entries()].sort(([a], [b]) => compareIngredientCategories(a, b))
  }, [shoppingList])

  const totals = useMemo(() => {
    const items = shoppingList?.shopping_list_items ?? []
    return { checked: items.filter((item) => item.checked).length, total: items.length }
  }, [shoppingList])

  if (!baby || planLoading || (plan && listLoading)) {
    return (
      <PageState
        description={`Organizando os itens da semana de ${weekRangeLabel}`}
        title="Preparando sua lista…"
      />
    )
  }

  if (planError || listError) {
    return (
      <PageState
        action={
          <button className="pp-btn pp-btn-primary" onClick={() => window.location.reload()} type="button">
            Tentar de novo
          </button>
        }
        description="A conexão falhou ao buscar sua lista. Verifique a internet e tente novamente."
        title="Não conseguimos abrir sua lista"
        variant="error"
      />
    )
  }

  async function handleGenerate(): Promise<boolean> {
    if (!plan) return false
    setIsGenerating(true)
    setGenerationError(null)
    try {
      await generateShoppingList(plan)
      analytics.track('shopping_list_generated', {
        meal_plan_id: plan.id,
      })
      await queryClient.invalidateQueries({
        queryKey: shoppingListQueryKey(plan.id),
      })
      return true
    } catch {
      setGenerationError(
        'Não conseguimos atualizar sua lista agora. Sua lista anterior foi mantida. Tente novamente em instantes.',
      )
      return false
    } finally {
      setIsGenerating(false)
    }
  }

  async function toggleItem(item: ShoppingListItem) {
    if (!plan) return
    setChangingItemId(item.id)
    setItemError(null)
    try {
      await setShoppingItemChecked(item.id, !item.checked)
      await queryClient.invalidateQueries({
        queryKey: shoppingListQueryKey(plan.id),
      })
    } catch {
      setItemError('Não conseguimos atualizar este item. Confira a conexão e toque novamente para tentar.')
    } finally {
      setChangingItemId(null)
    }
  }

  function closeItemDialog() {
    setItemDialog(null)
    setItemDialogError(null)
  }

  async function handleSubmitItem(values: ShoppingItemSubmit) {
    if (!plan) return
    setIsSavingItem(true)
    setItemDialogError(null)
    try {
      if (itemDialog?.mode === 'edit') {
        const patch: ShoppingListItemPatch = {
          quantity: values.quantity,
          unit: values.unit,
        }
        if (isManualItem(itemDialog.item)) patch.name = values.name
        await updateShoppingListItem(itemDialog.item.id, patch)
      } else {
        await addShoppingListItem(plan.id, {
          ingredientId: values.ingredientId,
          name: values.name,
          quantity: values.quantity,
          unit: values.unit,
        })
        analytics.track('shopping_list_generated', { meal_plan_id: plan.id, source: 'manual_item' })
      }
      await queryClient.invalidateQueries({ queryKey: shoppingListQueryKey(plan.id) })
      closeItemDialog()
    } catch (error) {
      setItemDialogError(describeItemSaveError(error))
    } finally {
      setIsSavingItem(false)
    }
  }

  async function handleRemoveItem() {
    if (!plan || itemDialog?.mode !== 'edit') return
    setIsSavingItem(true)
    setItemDialogError(null)
    try {
      await removeShoppingListItem(itemDialog.item.id)
      await queryClient.invalidateQueries({ queryKey: shoppingListQueryKey(plan.id) })
      closeItemDialog()
    } catch {
      setItemDialogError('Não conseguimos remover este item. Confira a conexão e tente novamente.')
    } finally {
      setIsSavingItem(false)
    }
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="pp-eyebrow">Compras da semana</p>
        <h1 className="mt-1.5 text-[28px] leading-tight text-ink-900 sm:text-[34px]">
          Lista de compras
        </h1>
        <p className="mt-2 text-sm text-ink-500">Semana de {weekRangeLabel}</p>
        <div className="mt-6">
          <PageState
            action={
              <Link className="pp-btn pp-btn-primary" to={`/app/week?week=${weekStart}`}>
                Montar minha semana
              </Link>
            }
            description="A lista nasce do cardápio. Monte as refeições desta semana e os ingredientes aparecem aqui agrupados."
            icon={ListChecks}
            title="Nenhum cardápio nesta semana"
            variant="empty"
          />
        </div>
        {!isThisWeek && (
          <Link
            className="pp-link mt-4 inline-flex text-sm"
            to={`/app/shopping-list?week=${getWeekStart()}`}
          >
            Voltar para esta semana
          </Link>
        )}
      </div>
    )
  }


  return (
    <div className="pp-shopping mx-auto max-w-3xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="pp-eyebrow">Compras de {baby.name}</p>
          <h1 className="pp-page-title">
            Lista de compras
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Semana de {weekRangeLabel}
            {isThisWeek ? ' · semana de hoje' : ''}
          </p>
          {!isThisWeek && (
            <Link
              className="pp-link mt-1 inline-flex text-sm"
              to={`/app/shopping-list?week=${getWeekStart()}`}
            >
              Voltar para esta semana
            </Link>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            className="pp-btn pp-btn-secondary w-full sm:w-auto"
            onClick={(event) => {
              itemDialogTriggerRef.current = event.currentTarget
              setItemDialog({ mode: 'add' })
            }}
            type="button"
          >
            <Plus aria-hidden="true" size={18} />
            Adicionar item
          </button>
          {/* Sem lista, a ação principal "Gerar lista de compras" fica no estado
              vazio; manter as duas duplicaria o mesmo botão na tela. */}
          {shoppingList && (
            <button
              className="pp-btn pp-btn-secondary w-full sm:w-auto"
              disabled={isGenerating}
              onClick={(event) => {
                confirmTriggerRef.current = event.currentTarget
                setShowConfirm(true)
              }}
              type="button"
            >
              <ShoppingCart aria-hidden="true" size={18} />
              {isGenerating ? 'Gerando…' : 'Atualizar com o cardápio'}
            </button>
          )}
        </div>
      </header>

      {itemError && <p className="pp-feedback-error" role="alert">{itemError}</p>}
      {generationError && (
        <p
          className="mt-4 rounded-[14px] bg-terracotta-100 px-4 py-3 text-sm leading-6 text-terracotta-500"
          role="alert"
        >
          {generationError}
        </p>
      )}

      {!shoppingList ? (
        <div className="mt-6">
          <PageState
            action={
              <button
                className="pp-btn pp-btn-primary"
                disabled={isGenerating}
                onClick={() => { void handleGenerate() }}
                type="button"
              >
                {isGenerating ? 'Gerando…' : 'Gerar lista de compras'}
              </button>
            }
            description="Agrupamos os ingredientes do seu cardápio por seção do mercado, somando as quantidades repetidas."
            icon={ShoppingCart}
            title="Sua lista está a um toque"
            variant="empty"
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Progresso da compra: barra + texto, nunca só cor. */}
          <div className="pp-shopping-progress">
            <p aria-live="polite">{totals.checked} de {totals.total} itens marcados</p>
            <progress aria-label="Itens da lista de compras" max={Math.max(1, totals.total)} value={totals.checked} />
            {totals.total > 0 && totals.checked === totals.total && <span className="mt-2 block text-sm text-sage-700">Tudo marcado. Sua lista está completa.</span>}
          </div>
          <p className="text-xs leading-5 text-ink-500">
            As quantidades somam o total previsto nas receitas da semana, na medida usada no preparo
            (colheres, unidades, gramas). Ajuste conforme o que você já tem em casa.
          </p>

          {groupedItems.map(([category, items]) => (
            <section className="pp-panel overflow-hidden" key={category}>
              <div className="flex items-center gap-2 border-b border-cream-100 bg-sage-50 px-5 py-3.5">
                <ListChecks aria-hidden="true" className="shrink-0 text-sage-700" size={18} />
                <h2 className="text-sm font-bold tracking-[0.06em] text-sage-700 uppercase">
                  {ingredientCategoryLabels[category]}
                </h2>
                <span className="ml-auto text-xs font-semibold text-sage-700">{items.length}</span>
              </div>
              <ul className="divide-y divide-cream-100">
                {items.map((item) => (
                  <li className="flex items-stretch" key={item.id}>
                    <button
                      aria-pressed={item.checked}
                      className="flex min-h-16 flex-1 items-center gap-3 px-5 text-left transition-colors hover:bg-cream-50 disabled:opacity-60"
                      disabled={changingItemId === item.id}
                      onClick={() => toggleItem(item)}
                      type="button"
                    >
                      <span
                        aria-hidden="true"
                        className={`grid size-7 shrink-0 place-items-center rounded-lg border ${
                          item.checked
                            ? 'border-sage-600 bg-sage-600 text-white'
                            : 'border-sage-300 bg-white'
                        }`}
                      >
                        {item.checked && <Check aria-hidden="true" className="pp-check-mark" size={16} strokeWidth={2.6} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[15px] break-words ${
                            item.checked
                              ? 'text-ink-500 line-through'
                              : 'font-medium text-ink-700'
                          }`}
                        >
                          {shoppingItemLabel(item)}
                        </span>
                        {isManualItem(item) && (
                          <span className="mt-0.5 block text-[11px] text-ink-500">Item livre</span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-ink-500">
                        {formatQuantityWithUnit(item.quantity, item.unit)}
                      </span>
                    </button>
                    <div className="flex items-center pr-2">
                      <button
                        aria-label={`Editar ${shoppingItemLabel(item)}`}
                        className="pp-icon-btn size-11"
                        onClick={(event) => {
                          itemDialogTriggerRef.current = event.currentTarget
                          setItemDialog({ mode: 'edit', item })
                        }}
                        type="button"
                      >
                        <Pencil aria-hidden="true" size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section
            aria-label="Levar a lista para o mercado"
            className="pp-panel-quiet grid gap-3 p-4 sm:grid-cols-2 sm:p-5"
          >
            <PdfExportButton
              baby={baby}
              kind="shopping"
              label="Imprimir lista de compras"
              shoppingList={shoppingList}
              weekStart={weekStart}
            />
            <Link className="pp-btn pp-btn-secondary w-full" to={`/app/week?week=${weekStart}`}>
              Ver o cardápio desta semana
            </Link>
          </section>
        </div>
      )}

      {showConfirm && (
        <ConfirmDialog
          confirmLabel="Atualizar lista"
          description="A lista será recalculada a partir das refeições do cardápio desta semana."
          details={[
            'As quantidades dos ingredientes do cardápio são recalculadas conforme a semana atual.',
            'Itens livres que você adicionou à mão são mantidos na lista.',
            'Ingredientes extras adicionados pela despensa são substituídos pelo cálculo do cardápio.',
            'As marcações de "comprado" dos itens do cardápio são zeradas.',
          ]}
          isConfirming={isGenerating}
          onClose={() => setShowConfirm(false)}
          onConfirm={async () => {
            await handleGenerate()
            setShowConfirm(false)
          }}
          returnFocusRef={confirmTriggerRef}
          title="Atualizar a lista de compras?"
        />
      )}

      {itemDialog && (
        <ShoppingItemDialog
          error={itemDialogError}
          ingredients={ingredients}
          isSaving={isSavingItem}
          item={itemDialog.mode === 'edit' ? itemDialog.item : undefined}
          mode={itemDialog.mode}
          onClose={closeItemDialog}
          onRemove={itemDialog.mode === 'edit' ? handleRemoveItem : undefined}
          onSubmit={handleSubmitItem}
          returnFocusRef={itemDialogTriggerRef}
        />
      )}
    </div>
  )
}
