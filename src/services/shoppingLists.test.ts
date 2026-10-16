import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MealPlan } from '../types/domain'

vi.mock('./supabase/auth-user', () => ({
  getAuthenticatedUserId: vi.fn(async () => 'user-1'),
}))

const supabaseMock = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }))

vi.mock('./supabase/client', () => ({
  getSupabaseClient: () => supabaseMock,
}))

function makeQueryBuilder(finalResult: { data?: unknown; error?: unknown }) {
  const builder: Record<string, unknown> = {}
  const record = () => vi.fn(() => builder)
  builder.select = record()
  builder.insert = record()
  builder.update = record()
  builder.upsert = record()
  builder.delete = record()
  builder.eq = record()
  builder.order = record()
  builder.limit = record()
  builder.single = vi.fn(async () => finalResult)
  builder.maybeSingle = vi.fn(async () => finalResult)
  builder.then = (onFulfilled: (value: unknown) => unknown) =>
    Promise.resolve(finalResult).then(onFulfilled)
  return builder as {
    select: ReturnType<typeof vi.fn>
    insert: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    upsert: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
    order: ReturnType<typeof vi.fn>
    limit: ReturnType<typeof vi.fn>
    single: ReturnType<typeof vi.fn>
    maybeSingle: ReturnType<typeof vi.fn>
  }
}

function queueTables(byTable: Record<string, ReturnType<typeof makeQueryBuilder>[]>) {
  supabaseMock.from.mockImplementation((table: string) => {
    const queue = byTable[table]
    if (!queue || queue.length === 0) {
      throw new Error(`Unexpected Supabase call for table "${table}"`)
    }
    return queue.shift()!
  })
}

const {
  addShoppingListItem,
  appendShoppingListItems,
  generateShoppingList,
  getShoppingList,
  removeShoppingListItem,
  setShoppingItemChecked,
  updateShoppingListItem,
} = await import('./shoppingLists')

beforeEach(() => {
  supabaseMock.from.mockReset()
  supabaseMock.rpc.mockReset()
})

const samplePlan: MealPlan = {
  id: 'plan-1',
  user_id: 'user-1',
  baby_id: 'baby-1',
  week_start: '2026-08-24',
  created_at: '',
  updated_at: '',
  meal_plan_items: [
    {
      id: 'i1',
      meal_plan_id: 'plan-1',
      date: '2026-08-24',
      meal_type: 'breakfast',
      position: 0,
      recipe_id: 'recipe-a',
      recipe: {
        id: 'recipe-a',
        name: 'Mingau',
        description: '',
        min_age_months: 6,
        meal_type: 'breakfast',
        prep_time_minutes: 10,
        instructions: '',
        serving_notes: null,
        storage_notes: null,
        substitutions: null,
        image_url: null,
        is_active: true,
        is_demo: false,
        recipe_ingredients: [
          {
            id: 'ri1',
            ingredient_id: 'ing-banana',
            quantity: 1,
            unit: 'unidade',
            is_optional: false,
            ingredient: {
              id: 'ing-banana',
              name: 'Banana',
              category: 'fruit',
              created_at: '',
            },
          },
        ],
        recipe_allergens: [],
      },
    },
  ],
}

describe('generateShoppingList', () => {
  it('substitui a lista com uma única chamada RPC atômica', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: 'list-1', error: null })

    const listId = await generateShoppingList(samplePlan)

    expect(listId).toBe('list-1')
    expect(supabaseMock.rpc).toHaveBeenCalledWith('replace_shopping_list', {
      p_meal_plan_id: 'plan-1',
      p_items: [{ ingredient_id: 'ing-banana', quantity: 1, unit: 'unidade' }],
    })
    // Não deve usar from() para gerar: a atomicidade vem da RPC.
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it('agrega itens repetidos antes de enviar à RPC', async () => {
    const planWithTwoBananas: MealPlan = {
      ...samplePlan,
      meal_plan_items: [samplePlan.meal_plan_items[0], { ...samplePlan.meal_plan_items[0], id: 'i2' }],
    }
    supabaseMock.rpc.mockResolvedValue({ data: 'list-1', error: null })

    await generateShoppingList(planWithTwoBananas)

    expect(supabaseMock.rpc).toHaveBeenCalledWith('replace_shopping_list', {
      p_meal_plan_id: 'plan-1',
      p_items: [{ ingredient_id: 'ing-banana', quantity: 2, unit: 'unidade' }],
    })
  })

  it('propaga erro da RPC (a lista anterior é preservada pelo banco)', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: null, error: new Error('rpc-fail') })

    await expect(generateShoppingList(samplePlan)).rejects.toThrow('rpc-fail')
  })
})

describe('setShoppingItemChecked', () => {
  it('atualiza somente o campo checked pelo id do item', async () => {
    const update = makeQueryBuilder({ data: null, error: null })
    queueTables({ shopping_list_items: [update] })

    await setShoppingItemChecked('item-1', true)

    expect(update.update).toHaveBeenCalledWith({ checked: true })
    expect(update.eq).toHaveBeenCalledWith('id', 'item-1')
  })

  it('propaga erro do banco', async () => {
    const update = makeQueryBuilder({ data: null, error: new Error('nope') })
    queueTables({ shopping_list_items: [update] })

    await expect(setShoppingItemChecked('item-1', false)).rejects.toThrow('nope')
  })
})

describe('appendShoppingListItems', () => {
  it('soma a quantidade ao item existente em vez de sobrescrever', async () => {
    const listUpsert = makeQueryBuilder({ data: { id: 'list-1' }, error: null })
    const readItems = makeQueryBuilder({
      data: [{ ingredient_id: 'ing-1', quantity: 3, unit: 'unidade' }],
      error: null,
    })
    const itemsUpsert = makeQueryBuilder({ data: null, error: null })
    queueTables({
      shopping_lists: [listUpsert],
      shopping_list_items: [readItems, itemsUpsert],
    })

    const listId = await appendShoppingListItems('plan-1', [
      { ingredient_id: 'ing-1', quantity: 2, unit: 'unidade' },
    ])

    expect(listId).toBe('list-1')
    expect(readItems.eq).toHaveBeenCalledWith('shopping_list_id', 'list-1')
    expect(itemsUpsert.upsert).toHaveBeenCalledWith(
      [{ ingredient_id: 'ing-1', quantity: 5, unit: 'unidade', shopping_list_id: 'list-1' }],
      { onConflict: 'shopping_list_id,ingredient_id,unit', ignoreDuplicates: false },
    )
  })

  it('insere o item quando ainda não existe na lista', async () => {
    const listUpsert = makeQueryBuilder({ data: { id: 'list-1' }, error: null })
    const readItems = makeQueryBuilder({ data: [], error: null })
    const itemsUpsert = makeQueryBuilder({ data: null, error: null })
    queueTables({
      shopping_lists: [listUpsert],
      shopping_list_items: [readItems, itemsUpsert],
    })

    await appendShoppingListItems('plan-1', [
      { ingredient_id: 'ing-1', quantity: 2, unit: 'unidade' },
    ])

    expect(itemsUpsert.upsert).toHaveBeenCalledWith(
      [{ ingredient_id: 'ing-1', quantity: 2, unit: 'unidade', shopping_list_id: 'list-1' }],
      { onConflict: 'shopping_list_id,ingredient_id,unit', ignoreDuplicates: false },
    )
  })

  it('não reenvia itens manuais ao somar ingredientes faltantes (evita violar a origem)', async () => {
    const listUpsert = makeQueryBuilder({ data: { id: 'list-1' }, error: null })
    const readItems = makeQueryBuilder({
      data: [
        { ingredient_id: 'ing-1', quantity: 3, unit: 'unidade' },
        { ingredient_id: null, quantity: 2, unit: 'pacote grande', custom_name: 'Fraldas' },
      ],
      error: null,
    })
    const itemsUpsert = makeQueryBuilder({ data: null, error: null })
    queueTables({
      shopping_lists: [listUpsert],
      shopping_list_items: [readItems, itemsUpsert],
    })

    await appendShoppingListItems('plan-1', [
      { ingredient_id: 'ing-1', quantity: 2, unit: 'unidade' },
    ])

    // O item manual (ingredient_id nulo) não entra no upsert: só o item de
    // catálogo é somado e reescrito.
    expect(itemsUpsert.upsert).toHaveBeenCalledWith(
      [{ ingredient_id: 'ing-1', quantity: 5, unit: 'unidade', shopping_list_id: 'list-1' }],
      { onConflict: 'shopping_list_id,ingredient_id,unit', ignoreDuplicates: false },
    )
  })

  it('propaga erro do upsert da lista', async () => {
    const listUpsert = makeQueryBuilder({ data: null, error: new Error('rls') })
    queueTables({ shopping_lists: [listUpsert] })

    await expect(
      appendShoppingListItems('plan-1', [{ ingredient_id: 'ing-1', quantity: 1, unit: 'un' }]),
    ).rejects.toThrow('rls')
  })

  it('propaga erro ao ler os itens existentes', async () => {
    const listUpsert = makeQueryBuilder({ data: { id: 'list-1' }, error: null })
    const readItems = makeQueryBuilder({ data: null, error: new Error('read-fail') })
    queueTables({
      shopping_lists: [listUpsert],
      shopping_list_items: [readItems],
    })

    await expect(
      appendShoppingListItems('plan-1', [{ ingredient_id: 'ing-1', quantity: 1, unit: 'un' }]),
    ).rejects.toThrow('read-fail')
  })

  it('propaga erro do upsert dos itens', async () => {
    const listUpsert = makeQueryBuilder({ data: { id: 'list-1' }, error: null })
    const readItems = makeQueryBuilder({ data: [], error: null })
    const itemsUpsert = makeQueryBuilder({ data: null, error: new Error('boom') })
    queueTables({
      shopping_lists: [listUpsert],
      shopping_list_items: [readItems, itemsUpsert],
    })

    await expect(
      appendShoppingListItems('plan-1', [{ ingredient_id: 'ing-1', quantity: 1, unit: 'un' }]),
    ).rejects.toThrow('boom')
  })
})

describe('getShoppingList', () => {
  it('lê o formato com item livre quando a coluna opcional existe', async () => {
    const query = makeQueryBuilder({
      data: { id: 'list-1', shopping_list_items: [] },
      error: null,
    })
    queueTables({ shopping_lists: [query] })

    const list = await getShoppingList('plan-1')

    expect(list?.id).toBe('list-1')
    expect(supabaseMock.from).toHaveBeenCalledTimes(1)
  })

  it('cai para o formato base quando a coluna opcional não existe', async () => {
    const manual = makeQueryBuilder({ data: null, error: new Error('column does not exist') })
    const base = makeQueryBuilder({
      data: {
        id: 'list-1',
        shopping_list_items: [
          { id: 'i1', ingredient_id: 'ing-1', quantity: 1, unit: 'un', checked: false, ingredient: null },
        ],
      },
      error: null,
    })
    queueTables({ shopping_lists: [manual, base] })

    const list = await getShoppingList('plan-1')

    expect(supabaseMock.from).toHaveBeenCalledTimes(2)
    expect(list?.shopping_list_items[0]?.custom_name).toBeNull()
  })
})

describe('addShoppingListItem', () => {
  it('insere um ingrediente do catálogo quando não existe na lista', async () => {
    const listUpsert = makeQueryBuilder({ data: { id: 'list-1' }, error: null })
    const readItems = makeQueryBuilder({ data: [], error: null })
    const insert = makeQueryBuilder({ data: null, error: null })
    queueTables({ shopping_lists: [listUpsert], shopping_list_items: [readItems, insert] })

    const listId = await addShoppingListItem('plan-1', {
      ingredientId: 'ing-1',
      name: 'Banana',
      quantity: 2,
      unit: 'unidade',
    })

    expect(listId).toBe('list-1')
    // Item do catálogo não envia `custom_name` (fica nulo por padrão no banco):
    // a inclusão funciona também antes da migração de itens manuais.
    expect(insert.insert).toHaveBeenCalledWith({
      shopping_list_id: 'list-1',
      ingredient_id: 'ing-1',
      quantity: 2,
      unit: 'unidade',
      checked: false,
    })
  })

  it('soma a quantidade quando o mesmo ingrediente e unidade já existem', async () => {
    const listUpsert = makeQueryBuilder({ data: { id: 'list-1' }, error: null })
    const readItems = makeQueryBuilder({
      data: [{ id: 'i1', ingredient_id: 'ing-1', custom_name: null, quantity: 3, unit: 'unidade' }],
      error: null,
    })
    const update = makeQueryBuilder({ data: null, error: null })
    queueTables({ shopping_lists: [listUpsert], shopping_list_items: [readItems, update] })

    await addShoppingListItem('plan-1', {
      ingredientId: 'ing-1',
      name: 'Banana',
      quantity: 2,
      unit: 'unidade',
    })

    expect(update.update).toHaveBeenCalledWith({ quantity: 5 })
    expect(update.eq).toHaveBeenCalledWith('id', 'i1')
  })

  it('grava um item livre com o rótulo escrito', async () => {
    const listUpsert = makeQueryBuilder({ data: { id: 'list-1' }, error: null })
    const readItems = makeQueryBuilder({ data: [], error: null })
    const insert = makeQueryBuilder({ data: null, error: null })
    queueTables({ shopping_lists: [listUpsert], shopping_list_items: [readItems, insert] })

    await addShoppingListItem('plan-1', {
      ingredientId: null,
      name: 'Fraldas',
      quantity: 1,
      unit: 'unidade',
    })

    expect(insert.insert).toHaveBeenCalledWith({
      shopping_list_id: 'list-1',
      ingredient_id: null,
      custom_name: 'Fraldas',
      quantity: 1,
      unit: 'unidade',
      checked: false,
    })
  })

  it('soma itens livres quando o nome e a unidade coincidem', async () => {
    const listUpsert = makeQueryBuilder({ data: { id: 'list-1' }, error: null })
    const readItems = makeQueryBuilder({
      data: [{ id: 'i1', ingredient_id: null, custom_name: 'papel toalha', quantity: 1, unit: 'unidade' }],
      error: null,
    })
    const update = makeQueryBuilder({ data: null, error: null })
    queueTables({ shopping_lists: [listUpsert], shopping_list_items: [readItems, update] })

    await addShoppingListItem('plan-1', {
      ingredientId: null,
      name: 'Papel Toalha',
      quantity: 2,
      unit: 'Unidade',
    })

    expect(update.update).toHaveBeenCalledWith({ quantity: 3 })
  })

  it('propaga erro ao salvar (item livre sem suporte no schema)', async () => {
    const listUpsert = makeQueryBuilder({ data: { id: 'list-1' }, error: null })
    const readItems = makeQueryBuilder({ data: [], error: null })
    const insert = makeQueryBuilder({ data: null, error: new Error('null value in column') })
    queueTables({ shopping_lists: [listUpsert], shopping_list_items: [readItems, insert] })

    await expect(
      addShoppingListItem('plan-1', { ingredientId: null, name: 'Fraldas', quantity: 1, unit: 'un' }),
    ).rejects.toThrow('null value in column')
  })
})

describe('updateShoppingListItem', () => {
  it('atualiza quantidade e unidade', async () => {
    const update = makeQueryBuilder({ data: null, error: null })
    queueTables({ shopping_list_items: [update] })

    await updateShoppingListItem('item-1', { quantity: 4, unit: 'g' })

    expect(update.update).toHaveBeenCalledWith({ quantity: 4, unit: 'g' })
    expect(update.eq).toHaveBeenCalledWith('id', 'item-1')
  })

  it('reescreve o rótulo de um item livre', async () => {
    const update = makeQueryBuilder({ data: null, error: null })
    queueTables({ shopping_list_items: [update] })

    await updateShoppingListItem('item-1', { quantity: 1, unit: 'un', name: 'Guardanapos' })

    expect(update.update).toHaveBeenCalledWith({ quantity: 1, unit: 'un', custom_name: 'Guardanapos' })
  })

  it('propaga erro do banco', async () => {
    const update = makeQueryBuilder({ data: null, error: new Error('nope') })
    queueTables({ shopping_list_items: [update] })

    await expect(updateShoppingListItem('item-1', { quantity: 1, unit: 'un' })).rejects.toThrow('nope')
  })
})

describe('removeShoppingListItem', () => {
  it('remove pelo id do item', async () => {
    const remove = makeQueryBuilder({ data: null, error: null })
    queueTables({ shopping_list_items: [remove] })

    await removeShoppingListItem('item-1')

    expect(remove.delete).toHaveBeenCalled()
    expect(remove.eq).toHaveBeenCalledWith('id', 'item-1')
  })
})
