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
          <button
            className="min-h-13 rounded-2xl bg-pumpkin px-5 text-sm font-medium text-[#2A2A22] hover:bg-pumpkin/90"
            onClick={() => window.location.reload()}
            type="button"
          >
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
    try {
      await setShoppingItemChecked(item.id, !item.checked)
      await queryClient.invalidateQueries({
        queryKey: shoppingListQueryKey(plan.id),
      })
    } finally {
      setChangingItemId(null)
    }
  }

  if (!plan) {
    return (
      <div>
        <p className="text-sm font-semibold text-terracotta-500">Compras da semana</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-ink-900">Lista de compras</h1>
        <p className="mt-2 text-sm text-ink-500">Semana de {weekRangeLabel}</p>
        <div className="mt-6">
          <PageState
            action={
              <Link
                className="inline-flex min-h-13 items-center rounded-2xl bg-pumpkin px-5 text-sm font-medium text-[#2A2A22] hover:bg-pumpkin/90"
                to={`/app/week?week=${weekStart}`}
              >
                Montar minha semana
              </Link>
            }
            description="A lista nasce do cardápio. Monte as refeições desta semana e os ingredientes aparecem aqui agrupados."
            title="Nenhum cardápio nesta semana"
            variant="empty"
          />
        </div>
        {!isThisWeek && (
          <Link
            className="mt-4 inline-flex text-sm font-semibold text-sage-700 underline decoration-sage-200 underline-offset-2"
            to={`/app/shopping-list?week=${getWeekStart()}`}
          >
            Voltar para esta semana
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-terracotta-500">Compras de {baby.name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-ink-900 sm:text-4xl">Lista de compras</h1>
          <p className="mt-2 text-sm text-ink-500">
            Semana de {weekRangeLabel}
            {isThisWeek ? ' · semana de hoje' : ''}
          </p>
          {!isThisWeek && (
            <Link
              className="mt-1 inline-flex text-sm font-semibold text-sage-700 underline decoration-sage-200 underline-offset-2"
              to={`/app/shopping-list?week=${getWeekStart()}`}
            >
              Voltar para esta semana
            </Link>
          )}
        </div>
        <button
          className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-pumpkin px-5 text-sm font-medium text-[#2A2A22] hover:bg-pumpkin/90 disabled:opacity-55"
          disabled={isGenerating}
          onClick={handleGenerate}
          type="button"
        >
          <ShoppingCart aria-hidden="true" size={18} />
          {isGenerating ? 'Gerando…' : shoppingList ? 'Atualizar com o cardápio' : 'Gerar lista de compras'}
        </button>
      </div>

      {generationError && (
        <p className="mt-4 rounded-2xl bg-terracotta-100/60 px-4 py-3 text-sm text-ink-700" role="alert">
          {generationError}
        </p>
      )}

      {!shoppingList ? (
        <div className="mt-6">
          <PageState
            action={
              <button
                className="min-h-13 rounded-2xl bg-pumpkin px-5 text-sm font-medium text-[#2A2A22] hover:bg-pumpkin/90 disabled:opacity-55"
                disabled={isGenerating}
                onClick={handleGenerate}
                type="button"
              >
                {isGenerating ? 'Gerando…' : 'Gerar lista de compras'}
              </button>
            }
            description="Agrupamos os ingredientes do seu cardápio por seção do mercado, somando as quantidades repetidas."
            title="Sua lista está a um toque"
            variant="empty"
          />
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          <p aria-live="polite" className="text-sm text-ink-500">
            {totals.checked} de {totals.total} itens marcados.
          </p>
          {groupedItems.map(([category, items]) => (
            <section className="overflow-hidden rounded-[22px] border border-cream-100 bg-white" key={category}>
              <div className="flex items-center gap-2 bg-sage-50 px-5 py-4">
                <ListChecks aria-hidden="true" className="text-sage-700" size={18} />
                <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-sage-700">
                  {ingredientCategoryLabels[category]}
                </h2>
              </div>
              <ul className="divide-y divide-cream-100">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      aria-pressed={item.checked}
                      className="flex min-h-16 w-full items-center gap-3 px-5 text-left transition hover:bg-cream-50 disabled:opacity-60"
                      disabled={changingItemId === item.id}
                      onClick={() => toggleItem(item)}
                      type="button"
                    >
                      <span className={`grid size-7 shrink-0 place-items-center rounded-lg border ${item.checked ? 'border-sage-600 bg-sage-600 text-white' : 'border-sage-500 bg-white'}`}>
                        {item.checked && <Check aria-hidden="true" size={16} />}
                      </span>
                      <span className={`flex-1 text-sm font-medium ${item.checked ? 'text-ink-500 line-through' : 'text-ink-700'}`}>
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
          <div className="rounded-[22px] bg-sage-50 p-4 sm:p-5">
            <PdfExportButton
              baby={baby}
              kind="shopping"
              label="Imprimir lista de compras"
              shoppingList={shoppingList}
              weekStart={weekStart}
            />
            <Link
              className="mt-3 flex min-h-12 items-center justify-center rounded-2xl border border-sage-200 bg-white px-5 text-center text-sm font-semibold text-sage-700 transition hover:border-sage-500"
              to={`/app/week?week=${weekStart}`}
            >
              Ver o cardápio desta semana
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
