// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { MealPlan, ShoppingList } from '../../types/domain'
import { HomePage } from './HomePage'

const state = vi.hoisted(() => ({
  plan: { data: null, isLoading: true, error: null, refetch: vi.fn() } as {
    data: unknown; isLoading: boolean; error: Error | null; refetch: () => void
  },
  shopping: { data: null } as { data: unknown },
}))

vi.mock('../../hooks/useBaby', () => ({ useBaby: () => ({ data: { id: 'baby', name: 'Alice', birth_date: '2025-12-10', photo_url: null } }) }))
vi.mock('../../hooks/useMealPlan', () => ({ useMealPlan: () => state.plan }))
vi.mock('../../hooks/useShoppingList', () => ({ useShoppingList: () => state.shopping }))
vi.mock('../../services/analytics', () => ({ analytics: { track: vi.fn() } }))
vi.mock('../../components/ui/InstallAppCard', () => ({ InstallAppCard: () => null }))
afterEach(() => {
  cleanup()
  state.plan = { data: null, isLoading: true, error: null, refetch: vi.fn() }
  state.shopping = { data: null }
})

describe('Home dashboard', () => {
  it('shows a personal daily heading and loading state, not an empty-week invitation during loading', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Pequenas refeições. Grandes descobertas.')
    expect(screen.getByText(/Carregando seu cardápio/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Montar minha semana/ })).toBeNull()
  })

  it('resume a semana com contagens reais de refeições, dias e progresso de compras', () => {
    const recipe = { id: 'r', name: 'Mingau', meal_type: 'breakfast' } as never
    state.plan = {
      data: {
        id: 'plan', week_start: '2026-09-14',
        meal_plan_items: [
          { id: '1', date: '2026-09-14', meal_type: 'breakfast', recipe },
          { id: '2', date: '2026-09-14', meal_type: 'lunch', recipe },
          { id: '3', date: '2026-09-15', meal_type: 'breakfast', recipe },
        ],
      } as unknown as MealPlan,
      isLoading: false, error: null, refetch: vi.fn(),
    }
    state.shopping = {
      data: {
        id: 'list',
        shopping_list_items: [
          { id: 'a', checked: true, ingredient: { name: 'Banana' } },
          { id: 'b', checked: false, ingredient: { name: 'Aveia' } },
        ],
      } as unknown as ShoppingList,
    }
    render(<MemoryRouter><HomePage /></MemoryRouter>)

    const summary = screen.getByRole('region', { name: 'Resumo da semana' })
    expect(summary.textContent).toContain('3')
    expect(summary.textContent).toContain('refeições planejadas')
    expect(summary.textContent).toContain('2/7')
    expect(summary.textContent).toContain('1/2')
    expect(summary.textContent).toContain('itens comprados')
    // Cada resumo leva para a página correspondente.
    const links = summary.querySelectorAll('a')
    expect(links[0].getAttribute('href')).toContain('/app/week?week=')
    expect(links[2].getAttribute('href')).toContain('/app/shopping-list?week=')
  })

  it('convida a montar a lista quando ainda não há lista de compras', () => {
    const recipe = { id: 'r', name: 'Mingau', meal_type: 'breakfast' } as never
    state.plan = {
      data: {
        id: 'plan', week_start: '2026-09-14',
        meal_plan_items: [{ id: '1', date: '2026-09-14', meal_type: 'breakfast', recipe }],
      } as unknown as MealPlan,
      isLoading: false, error: null, refetch: vi.fn(),
    }
    state.shopping = { data: null }
    render(<MemoryRouter><HomePage /></MemoryRouter>)

    const summary = screen.getByRole('region', { name: 'Resumo da semana' })
    expect(summary.textContent).toContain('Montar lista de compras')
    expect(summary.textContent).not.toContain('0/0')
    expect(summary.querySelectorAll('a')[2].getAttribute('href')).toContain('/app/shopping-list?week=')
  })
})
