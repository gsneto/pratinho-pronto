import { useQueryClient } from '@tanstack/react-query'
import { Check, ListChecks, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { PageState } from '../../components/ui/PageState'
import { useBaby } from '../../hooks/useBaby'
import { useMealPlan } from '../../hooks/useMealPlan'
import { shoppingListQueryKey, useShoppingList } from '../../hooks/useShoppingList'
import { analytics } from '../../services/analytics'
import {
  generateShoppingList,
  setShoppingItemChecked,
} from '../../services/shoppingLists'
import type { IngredientCategory, ShoppingListItem } from '../../types/domain'
import { addDays, formatShortDate, getWeekStart, normalizeWeekStart } from '../../utils/dates'
import { compareIngredientCategories, ingredientCategoryLabels } from '../../utils/labels'

export function ShoppingListPage() {
  const queryClient = useQueryClient()
  const { data: baby } = useBaby()
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

  const groupedItems = useMemo(() => {
    const groups = new Map<IngredientCategory, ShoppingListItem[]>()
    shoppingList?.shopping_list_items
      .slice()
      .sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name, 'pt-BR'))
      .forEach((item) => {
        const category = item.ingredient.category
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

  async function handleGenerate() {
    if (!plan) return
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
    } catch {
      setGenerationError('Não conseguimos montar sua lista agora. Tente novamente em instantes.')
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
        <button
          className={`pp-btn w-full sm:w-auto ${shoppingList ? 'pp-btn-secondary' : 'pp-btn-primary'}`}
          disabled={isGenerating}
          onClick={handleGenerate}
          type="button"
        >
          <ShoppingCart aria-hidden="true" size={18} />
          {isGenerating ? 'Gerando…' : shoppingList ? 'Atualizar com o cardápio' : 'Gerar lista de compras'}
        </button>
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
                onClick={handleGenerate}
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
                  <li key={item.id}>
                    <button
                      aria-pressed={item.checked}
                      className="flex min-h-16 w-full items-center gap-3 px-5 text-left transition-colors hover:bg-cream-50 disabled:opacity-60"
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
                        {item.checked && <Check size={16} strokeWidth={2.6} />}
                      </span>
                      <span
                        className={`flex-1 text-[15px] ${
                          item.checked
                            ? 'text-ink-500 line-through'
                            : 'font-medium text-ink-700'
                        }`}
                      >
                        {item.ingredient.name}
                      </span>
                      <span className="shrink-0 text-xs text-ink-500">
                        {Number(item.quantity).toLocaleString('pt-BR')} {item.unit}
                      </span>
                    </button>
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
    </div>
  )
}
