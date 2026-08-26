import { useQueryClient } from '@tanstack/react-query'
import { Check, ListChecks, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { getWeekStart } from '../../utils/dates'
import { ingredientCategoryLabels } from '../../utils/labels'

export function ShoppingListPage() {
  const queryClient = useQueryClient()
  const { data: baby } = useBaby()
  const weekStart = getWeekStart()
  const { data: plan, error: planError, isLoading: planLoading } = useMealPlan(
    baby?.id,
    weekStart,
  )
  const { data: shoppingList, error: listError, isLoading: listLoading } =
    useShoppingList(plan?.id)
  const [isGenerating, setIsGenerating] = useState(false)
  const [changingItemId, setChangingItemId] = useState<string | null>(null)

  const groupedItems = useMemo(() => {
    const groups = new Map<IngredientCategory, ShoppingListItem[]>()
    shoppingList?.shopping_list_items
      .slice()
      .sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name, 'pt-BR'))
      .forEach((item) => {
        const category = item.ingredient.category
        groups.set(category, [...(groups.get(category) ?? []), item])
      })
    return groups
  }, [shoppingList])

  if (!baby || planLoading || (plan && listLoading)) {
    return <PageState description="Organizando os itens da semana atual." title="Preparando sua lista…" />
  }

  if (planError || listError) {
    return (
      <PageState
        description="Não foi possível carregar a lista de compras."
        title="Lista indisponível"
        variant="error"
      />
    )
  }

  async function handleGenerate() {
    if (!plan) return
    setIsGenerating(true)
    try {
      await generateShoppingList(plan)
      analytics.track('shopping_list_generated', {
        meal_plan_id: plan.id,
      })
      await queryClient.invalidateQueries({
        queryKey: shoppingListQueryKey(plan.id),
      })
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
        <div className="mt-6">
          <PageState
            description="Monte um cardápio para transformá-lo automaticamente em uma lista."
            title="Nenhum cardápio na semana atual"
            variant="empty"
          />
        </div>
        <Link className="mt-5 inline-flex min-h-13 w-full items-center justify-center rounded-2xl bg-pumpkin px-5 font-medium text-[#2A2A22] hover:bg-pumpkin/90 sm:w-auto" to="/app/week">
          Montar minha semana
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-terracotta-500">Compras de {baby.name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-ink-900 sm:text-4xl">Lista de compras</h1>
          <p className="mt-2 text-sm text-ink-500">Itens da semana iniciada em {new Date(`${weekStart}T12:00:00`).toLocaleDateString('pt-BR')}.</p>
        </div>
        <button
          className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-pumpkin px-5 text-sm font-medium text-[#2A2A22] hover:bg-pumpkin/90 disabled:opacity-55"
          disabled={isGenerating}
          onClick={handleGenerate}
          type="button"
        >
          <ShoppingCart aria-hidden="true" size={18} />
          {isGenerating ? 'Gerando…' : shoppingList ? 'Atualizar lista' : 'Gerar lista de compras'}
        </button>
      </div>

      {!shoppingList ? (
        <div className="mt-6">
          <PageState
            description="Clique em “Gerar lista de compras” para agrupar os ingredientes do cardápio."
            title="Sua lista está a um toque"
            variant="empty"
          />
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          {[...groupedItems.entries()].map(([category, items]) => (
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
                      className="flex min-h-16 w-full items-center gap-3 px-5 text-left disabled:opacity-60"
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
                      <span className="text-xs text-ink-500">
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
            />
          </div>
        </div>
      )}
    </div>
  )
}
