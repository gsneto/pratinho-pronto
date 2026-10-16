// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { testBaby, testIngredient, testPlan, testShoppingList } from '../../test/fixtures'
import { ShoppingListPage } from './ShoppingListPage'
import {
  addShoppingListItem,
  generateShoppingList,
  removeShoppingListItem,
  setShoppingItemChecked,
  updateShoppingListItem,
} from '../../services/shoppingLists'

vi.mock('../../hooks/useBaby', () => ({ useBaby: () => ({ data: testBaby }) }))
vi.mock('../../hooks/useMealPlan', () => ({ useMealPlan: () => ({ data: testPlan }) }))
vi.mock('../../hooks/useRecipes', () => ({ useIngredients: () => ({ data: [testIngredient] }) }))
vi.mock('../../hooks/useShoppingList', () => ({ useShoppingList: () => ({ data: testShoppingList }), shoppingListQueryKey: (id: string) => ['shopping', id] }))
vi.mock('../../services/shoppingLists', () => ({
  addShoppingListItem: vi.fn(),
  generateShoppingList: vi.fn(),
  removeShoppingListItem: vi.fn(),
  setShoppingItemChecked: vi.fn(),
  updateShoppingListItem: vi.fn(),
}))
vi.mock('../../services/analytics', () => ({ analytics: { track: vi.fn() } }))
vi.mock('../../components/pdf/PdfExportButton', () => ({ PdfExportButton: ({ label }: { label: string }) => <button>{label}</button> }))
afterEach(cleanup)
beforeEach(() => vi.clearAllMocks())

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
  fireEvent.click(screen.getByRole('button', { name: /^Banana/ }))
  expect((await screen.findByRole('alert')).textContent).toMatch(/Não conseguimos atualizar este item/)
  expect(screen.getByRole('button', { name: /^Banana/ }).getAttribute('aria-pressed')).toBe('false')
})

it('pede confirmação antes de substituir a lista existente', () => {
  renderShopping()
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar com o cardápio' }))
  expect(screen.getByRole('dialog')).toBeTruthy()
  expect(screen.getByText(/marcações de "comprado" dos itens do cardápio são zeradas/)).toBeTruthy()
  expect(screen.getByText(/Itens livres que você adicionou à mão são mantidos/)).toBeTruthy()
  // Ainda não gerou: só confirmou a abertura do diálogo.
  expect(generateShoppingList).not.toHaveBeenCalled()
})

it('cancelar a confirmação não gera a lista', () => {
  renderShopping()
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar com o cardápio' }))
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(generateShoppingList).not.toHaveBeenCalled()
})

it('confirmar gera a lista e fecha o diálogo', async () => {
  vi.mocked(generateShoppingList).mockResolvedValueOnce('list-1')
  renderShopping()
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar com o cardápio' }))
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar lista' }))
  await vi.waitFor(() => expect(generateShoppingList).toHaveBeenCalledTimes(1))
  await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
})

it('falha ao confirmar mostra erro e não promete sucesso', async () => {
  vi.mocked(generateShoppingList).mockRejectedValueOnce(new Error('rpc-fail'))
  renderShopping()
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar com o cardápio' }))
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar lista' }))
  expect((await screen.findByRole('alert')).textContent).toMatch(/lista anterior foi mantida/)
})

it('adiciona um item pelo nome, ligado ao catálogo quando o nome coincide', async () => {
  vi.mocked(addShoppingListItem).mockResolvedValueOnce('list-1')
  renderShopping()
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }))
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nome do item'), { target: { value: 'banana' } })
  fireEvent.change(within(dialog).getByLabelText('Quantidade'), { target: { value: '3' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Adicionar à lista' }))
  await vi.waitFor(() =>
    expect(addShoppingListItem).toHaveBeenCalledWith('test-plan', {
      ingredientId: testIngredient.id,
      name: 'banana',
      quantity: 3,
      unit: 'unidade',
    }),
  )
})

it('adiciona um item livre quando o nome não está no catálogo', async () => {
  vi.mocked(addShoppingListItem).mockResolvedValueOnce('list-1')
  renderShopping()
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }))
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nome do item'), { target: { value: 'Fraldas' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Adicionar à lista' }))
  await vi.waitFor(() =>
    expect(addShoppingListItem).toHaveBeenCalledWith('test-plan', {
      ingredientId: null,
      name: 'Fraldas',
      quantity: 1,
      unit: 'unidade',
    }),
  )
})

it('valida nome, quantidade e unidade antes de enviar', () => {
  renderShopping()
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }))
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nome do item'), { target: { value: '   ' } })
  fireEvent.change(within(dialog).getByLabelText('Quantidade'), { target: { value: '0' } })
  fireEvent.change(within(dialog).getByLabelText('Unidade'), { target: { value: '' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Adicionar à lista' }))
  expect(within(dialog).getAllByRole('alert')).toHaveLength(3)
  expect(addShoppingListItem).not.toHaveBeenCalled()
})

it('informa quando um item livre não pode ser salvo', async () => {
  vi.mocked(addShoppingListItem).mockRejectedValueOnce(new Error('missing column'))
  renderShopping()
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }))
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nome do item'), { target: { value: 'Fraldas' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Adicionar à lista' }))
  expect((await within(dialog).findByRole('alert')).textContent).toMatch(/item livre/)
})

it('edita a quantidade de um item existente', async () => {
  vi.mocked(updateShoppingListItem).mockResolvedValueOnce(undefined)
  renderShopping()
  fireEvent.click(screen.getByRole('button', { name: 'Editar Banana' }))
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Quantidade'), { target: { value: '5' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar item' }))
  await vi.waitFor(() =>
    expect(updateShoppingListItem).toHaveBeenCalledWith('test-shopping-item', {
      quantity: 5,
      unit: 'unidades',
    }),
  )
})

it('remove um item existente', async () => {
  vi.mocked(removeShoppingListItem).mockResolvedValueOnce(undefined)
  renderShopping()
  fireEvent.click(screen.getByRole('button', { name: 'Editar Banana' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remover item da lista' }))
  await vi.waitFor(() => expect(removeShoppingListItem).toHaveBeenCalledWith('test-shopping-item'))
})
