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

const { listFavoriteRecipeIds, setRecipeFavorite } = await import('./favorites')

beforeEach(() => {
  supabaseMock.from.mockReset()
  window.localStorage.clear()
})

describe('listFavoriteRecipeIds', () => {
  it('retorna os favoritos do servidor', async () => {
    supabaseMock.from.mockReturnValue(makeBuilder({ data: [{ recipe_id: 'a' }], error: null }))
    expect(await listFavoriteRecipeIds()).toEqual(['a'])
  })

  it('une o fallback local com o servidor (não perde favorito offline)', async () => {
    window.localStorage.setItem('pratinho-favorites:user-1', JSON.stringify(['b']))
    supabaseMock.from.mockReturnValue(makeBuilder({ data: [{ recipe_id: 'a' }], error: null }))
    expect((await listFavoriteRecipeIds()).sort()).toEqual(['a', 'b'])
  })

  it('usa o fallback local quando o servidor falha', async () => {
    window.localStorage.setItem('pratinho-favorites:user-1', JSON.stringify(['c']))
    supabaseMock.from.mockReturnValue(makeBuilder({ data: null, error: new Error('offline') }))
    expect(await listFavoriteRecipeIds()).toEqual(['c'])
  })

  it('não duplica um favorito presente nos dois lados', async () => {
    window.localStorage.setItem('pratinho-favorites:user-1', JSON.stringify(['a']))
    supabaseMock.from.mockReturnValue(makeBuilder({ data: [{ recipe_id: 'a' }], error: null }))
    expect(await listFavoriteRecipeIds()).toEqual(['a'])
  })
})

describe('setRecipeFavorite', () => {
  it('grava no fallback local quando o servidor falha ao favoritar', async () => {
    supabaseMock.from.mockReturnValue(makeBuilder({ data: null, error: new Error('offline') }))
    await setRecipeFavorite('x', true)
    expect(JSON.parse(window.localStorage.getItem('pratinho-favorites:user-1') ?? '[]')).toEqual(['x'])
  })

  it('remove do fallback local quando o servidor falha ao desfavoritar', async () => {
    window.localStorage.setItem('pratinho-favorites:user-1', JSON.stringify(['x', 'y']))
    supabaseMock.from.mockReturnValue(makeBuilder({ data: null, error: new Error('offline') }))
    await setRecipeFavorite('x', false)
    expect(JSON.parse(window.localStorage.getItem('pratinho-favorites:user-1') ?? '[]')).toEqual(['y'])
  })
})
