// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./supabase/auth-user', () => ({
  getAuthenticatedUserId: vi.fn(async () => 'user-1'),
}))

const supabaseMock = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('./supabase/client', () => ({
  getSupabaseClient: () => supabaseMock,
}))

function makeBuilder(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, unknown> = {}
  const chain = () => vi.fn(() => builder)
  builder.select = chain()
  builder.upsert = chain()
  builder.delete = chain()
  builder.eq = chain()
  builder.then = (onFulfilled: (value: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled)
  return builder
}

function queueBuilders(builders: ReturnType<typeof makeBuilder>[]) {
  let index = 0
  supabaseMock.from.mockImplementation(() => {
    const builder = builders[index]
    if (!builder) throw new Error('Unexpected extra Supabase call')
    index += 1
    return builder
  })
}

const { listFavoriteRecipeIds, setRecipeFavorite } = await import('./favorites')

beforeEach(() => {
  supabaseMock.from.mockReset()
  window.localStorage.clear()
})

describe('listFavoriteRecipeIds', () => {
  it('online sem pendências: retorna o servidor e atualiza o cache', async () => {
    queueBuilders([makeBuilder({ data: [{ recipe_id: 'a' }], error: null })])
    expect(await listFavoriteRecipeIds()).toEqual(['a'])
    expect(JSON.parse(window.localStorage.getItem('pratinho-favorites:user-1') ?? '[]')).toEqual(['a'])
  })

  it('online com adição pendente: une, sincroniza e limpa a fila', async () => {
    window.localStorage.setItem('pratinho-favorites-pending:user-1', JSON.stringify({ b: true }))
    queueBuilders([
      makeBuilder({ data: [{ recipe_id: 'a' }], error: null }),
      makeBuilder({ data: null, error: null }),
    ])
    expect((await listFavoriteRecipeIds()).sort()).toEqual(['a', 'b'])
    expect(window.localStorage.getItem('pratinho-favorites-pending:user-1')).toBeNull()
    expect(JSON.parse(window.localStorage.getItem('pratinho-favorites:user-1') ?? '[]')).toEqual(['a', 'b'])
  })

  it('remoção offline não reaparece quando o servidor ainda tem o item', async () => {
    window.localStorage.setItem('pratinho-favorites-pending:user-1', JSON.stringify({ a: false }))
    queueBuilders([
      makeBuilder({ data: [{ recipe_id: 'a' }], error: null }),
      makeBuilder({ data: null, error: null }),
    ])
    expect(await listFavoriteRecipeIds()).toEqual([])
    expect(window.localStorage.getItem('pratinho-favorites-pending:user-1')).toBeNull()
    expect(JSON.parse(window.localStorage.getItem('pratinho-favorites:user-1') ?? '[]')).toEqual([])
  })

  it('offline usa o cache com a fila aplicada', async () => {
    window.localStorage.setItem('pratinho-favorites:user-1', JSON.stringify(['a']))
    window.localStorage.setItem('pratinho-favorites-pending:user-1', JSON.stringify({ b: true, a: false }))
    queueBuilders([makeBuilder({ data: null, error: new Error('offline') })])
    expect(await listFavoriteRecipeIds()).toEqual(['b'])
  })

  it('falha parcial no flush mantém a pendência e mostra a intenção', async () => {
    window.localStorage.setItem('pratinho-favorites-pending:user-1', JSON.stringify({ b: true }))
    queueBuilders([
      makeBuilder({ data: [], error: null }),
      makeBuilder({ data: null, error: new Error('nope') }),
    ])
    expect(await listFavoriteRecipeIds()).toEqual(['b'])
    expect(JSON.parse(window.localStorage.getItem('pratinho-favorites-pending:user-1') ?? '{}')).toEqual({ b: true })
  })

  it('não duplica item presente no servidor e na fila', async () => {
    window.localStorage.setItem('pratinho-favorites-pending:user-1', JSON.stringify({ a: true }))
    queueBuilders([
      makeBuilder({ data: [{ recipe_id: 'a' }], error: null }),
      makeBuilder({ data: null, error: null }),
    ])
    expect(await listFavoriteRecipeIds()).toEqual(['a'])
  })
})

describe('setRecipeFavorite', () => {
  it('sucesso remove a pendência do item', async () => {
    window.localStorage.setItem('pratinho-favorites-pending:user-1', JSON.stringify({ a: true }))
    queueBuilders([makeBuilder({ data: null, error: null })])
    await setRecipeFavorite('a', true)
    expect(window.localStorage.getItem('pratinho-favorites-pending:user-1')).toBeNull()
  })

  it('falha ao favoritar registra adição pendente', async () => {
    queueBuilders([makeBuilder({ data: null, error: new Error('offline') })])
    await setRecipeFavorite('x', true)
    expect(JSON.parse(window.localStorage.getItem('pratinho-favorites-pending:user-1') ?? '{}')).toEqual({ x: true })
  })

  it('falha ao desfavoritar registra remoção pendente', async () => {
    queueBuilders([makeBuilder({ data: null, error: new Error('offline') })])
    await setRecipeFavorite('y', false)
    expect(JSON.parse(window.localStorage.getItem('pratinho-favorites-pending:user-1') ?? '{}')).toEqual({ y: false })
  })
})
