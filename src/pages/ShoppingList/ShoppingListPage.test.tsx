// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { testBaby, testPlan, testShoppingList } from '../../test/fixtures'
import { ShoppingListPage } from './ShoppingListPage'
import { setShoppingItemChecked } from '../../services/shoppingLists'

vi.mock('../../hooks/useBaby', () => ({ useBaby: () => ({ data: testBaby }) }))
vi.mock('../../hooks/useMealPlan', () => ({ useMealPlan: () => ({ data: testPlan }) }))
vi.mock('../../hooks/useShoppingList', () => ({ useShoppingList: () => ({ data: testShoppingList }), shoppingListQueryKey: (id: string) => ['shopping', id] }))
vi.mock('../../services/shoppingLists', () => ({ generateShoppingList: vi.fn(), setShoppingItemChecked: vi.fn() }))
vi.mock('../../services/analytics', () => ({ analytics: { track: vi.fn() } }))
vi.mock('../../components/pdf/PdfExportButton', () => ({ PdfExportButton: ({ label }: { label: string }) => <button>{label}</button> }))
afterEach(cleanup)

function renderShopping() {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/app/shopping-list?week=2026-09-14']}><ShoppingListPage /></MemoryRouter></QueryClientProvider>)
}

it('exposes shopping progress to assistive technology and preserves the selected week', () => {
  renderShopping()
  const progress = screen.getByRole('progressbar', { name: 'Itens da lista de compras' }) as HTMLProgressElement
  expect(progress.value).toBe(0)
  expect(progress.max).toBe(1)
  expect(screen.getByRole('link', { name: 'Ver o cardápio desta semana' }).getAttribute('href')).toBe('/app/week?week=2026-09-14')
})

it('shows a failed item update and leaves the item unchecked for retry', async () => {
  vi.mocked(setShoppingItemChecked).mockRejectedValueOnce(new Error('offline'))
  renderShopping()
  fireEvent.click(screen.getByRole('button', { name: /Banana/ }))
  expect((await screen.findByRole('alert')).textContent).toMatch(/Não conseguimos atualizar este item/)
  expect(screen.getByRole('button', { name: /Banana/ }).getAttribute('aria-pressed')).toBe('false')
})

