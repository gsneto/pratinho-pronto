import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GeneratedMealPlanItem, MealPlan } from '../types/domain'

// A camada de escrita nunca foi testada; qualquer regressão no payload,
// tratamento de erro do Supabase ou lógica de posicionamento aparece aqui.
vi.mock('./supabase/auth-user', () => ({
  getAuthenticatedUserId: vi.fn(async () => 'user-1'),
}))

const supabaseMock = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('./supabase/client', () => ({
  getSupabaseClient: () => supabaseMock,
}))

// Helper builder for the chained Supabase query API. Cada método guarda o que
// foi chamado, permitindo asserção do payload sem depender do driver real.
type QueryStep = Record<string, unknown> | null
function makeQueryBuilder(finalResult: { data?: unknown; error?: unknown }) {
  const calls: QueryStep[] = []
  const builder: Record<string, unknown> = {
    calls,
  }
  const record = (name: string) =>
    vi.fn((...args: unknown[]) => {
      calls.push({ [name]: args })
      return builder
    })
  builder.select = record('select')
  builder.insert = record('insert')
  builder.update = record('update')
  builder.upsert = record('upsert')
  builder.delete = record('delete')
  builder.eq = record('eq')
  builder.order = record('order')
  builder.limit = record('limit')
  builder.single = vi.fn(async () => finalResult)
  builder.maybeSingle = vi.fn(async () => finalResult)
  // Support awaiting the builder directly for chains that end without .single().
  builder.then = (onFulfilled: (value: unknown) => unknown) =>
    Promise.resolve(finalResult).then(onFulfilled)
  return builder as {
    calls: QueryStep[]
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
  addRecipeToMealPlan,
  duplicateMealPlan,
  replaceMealPlanItem,
  saveMealPlan,
} = await import('./mealPlans')

beforeEach(() => {
  supabaseMock.from.mockReset()
})

const sampleItems: GeneratedMealPlanItem[] = [
  {
    date: '2026-08-24',
    meal_type: 'breakfast',
    position: 0,
    recipe_id: 'recipe-a',
    recipe: { id: 'recipe-a' } as unknown as GeneratedMealPlanItem['recipe'],
  },
  {
    date: '2026-08-25',
    meal_type: 'lunch',
    position: 0,
    recipe_id: 'recipe-b',
    recipe: { id: 'recipe-b' } as unknown as GeneratedMealPlanItem['recipe'],
  },
]

describe('saveMealPlan', () => {
  it('faz upsert do plano, remove itens antigos e insere novos', async () => {
    const planUpsert = makeQueryBuilder({ data: { id: 'plan-1' }, error: null })
    const deleteItems = makeQueryBuilder({ data: null, error: null })
    const insertItems = makeQueryBuilder({ data: null, error: null })
    queueTables({
      meal_plans: [planUpsert],
      meal_plan_items: [deleteItems, insertItems],
    })

    const planId = await saveMealPlan('baby-1', '2026-08-24', sampleItems)

    expect(planId).toBe('plan-1')
    expect(planUpsert.upsert).toHaveBeenCalledWith(
      { baby_id: 'baby-1', user_id: 'user-1', week_start: '2026-08-24' },
      { onConflict: 'user_id,baby_id,week_start' },
    )
    expect(deleteItems.delete).toHaveBeenCalled()
    expect(deleteItems.eq).toHaveBeenCalledWith('meal_plan_id', 'plan-1')
    expect(insertItems.insert).toHaveBeenCalledWith([
      {
        date: '2026-08-24',
        meal_plan_id: 'plan-1',
        meal_type: 'breakfast',
        position: 0,
        recipe_id: 'recipe-a',
      },
      {
        date: '2026-08-25',
        meal_plan_id: 'plan-1',
        meal_type: 'lunch',
        position: 0,
        recipe_id: 'recipe-b',
      },
    ])
  })

  it('propaga erro do upsert do plano sem tocar em meal_plan_items', async () => {
    const planUpsert = makeQueryBuilder({ data: null, error: new Error('rls') })
    queueTables({ meal_plans: [planUpsert] })

    await expect(saveMealPlan('baby-1', '2026-08-24', sampleItems)).rejects.toThrow('rls')
    expect(supabaseMock.from).toHaveBeenCalledTimes(1)
  })

  it('propaga erro da deleção de itens antes de tentar inserir', async () => {
    const planUpsert = makeQueryBuilder({ data: { id: 'plan-1' }, error: null })
    const deleteItems = makeQueryBuilder({ data: null, error: new Error('boom') })
    queueTables({ meal_plans: [planUpsert], meal_plan_items: [deleteItems] })

    await expect(saveMealPlan('baby-1', '2026-08-24', sampleItems)).rejects.toThrow('boom')
  })
})

describe('replaceMealPlanItem', () => {
  it('faz update do recipe_id no item pelo id', async () => {
    const update = makeQueryBuilder({ data: null, error: null })
    queueTables({ meal_plan_items: [update] })

    await replaceMealPlanItem('item-1', 'recipe-x')

    expect(update.update).toHaveBeenCalledWith({ recipe_id: 'recipe-x' })
    expect(update.eq).toHaveBeenCalledWith('id', 'item-1')
  })

  it('propaga erro do banco', async () => {
    const update = makeQueryBuilder({ data: null, error: new Error('nope') })
    queueTables({ meal_plan_items: [update] })

    await expect(replaceMealPlanItem('item-1', 'recipe-x')).rejects.toThrow('nope')
  })
})

describe('addRecipeToMealPlan', () => {
  it('quando replaceExisting=true, apaga itens do slot e insere na posição 0', async () => {
    const planUpsert = makeQueryBuilder({ data: { id: 'plan-1' }, error: null })
    const deleteExisting = makeQueryBuilder({ data: null, error: null })
    const insertItem = makeQueryBuilder({ data: null, error: null })
    queueTables({
      meal_plans: [planUpsert],
      meal_plan_items: [deleteExisting, insertItem],
    })

    const planId = await addRecipeToMealPlan({
      babyId: 'baby-1',
      date: '2026-08-24',
      mealType: 'breakfast',
      recipeId: 'recipe-x',
      replaceExisting: true,
      weekStart: '2026-08-24',
    })

    expect(planId).toBe('plan-1')
    // Delete deve filtrar por plano + data + tipo de refeição.
    const eqArgs = deleteExisting.eq.mock.calls.map((call) => call.slice(0, 2))
    expect(eqArgs).toEqual([
      ['meal_plan_id', 'plan-1'],
      ['date', '2026-08-24'],
      ['meal_type', 'breakfast'],
    ])
    expect(insertItem.insert).toHaveBeenCalledWith({
      date: '2026-08-24',
      meal_plan_id: 'plan-1',
      meal_type: 'breakfast',
      position: 0,
      recipe_id: 'recipe-x',
    })
  })

  it('quando replaceExisting=false e slot está vazio, insere na posição 0', async () => {
    const planUpsert = makeQueryBuilder({ data: { id: 'plan-1' }, error: null })
    const listExisting = makeQueryBuilder({ data: [], error: null })
    const insertItem = makeQueryBuilder({ data: null, error: null })
    queueTables({
      meal_plans: [planUpsert],
      meal_plan_items: [listExisting, insertItem],
    })

    await addRecipeToMealPlan({
      babyId: 'baby-1',
      date: '2026-08-24',
      mealType: 'breakfast',
      recipeId: 'recipe-x',
      replaceExisting: false,
      weekStart: '2026-08-24',
    })

    expect(listExisting.select).toHaveBeenCalledWith('position')
    expect(insertItem.insert).toHaveBeenCalledWith(
      expect.objectContaining({ position: 0, recipe_id: 'recipe-x' }),
    )
  })

  it('quando replaceExisting=false e há item, insere na posição seguinte', async () => {
    const planUpsert = makeQueryBuilder({ data: { id: 'plan-1' }, error: null })
    const listExisting = makeQueryBuilder({ data: [{ position: 2 }], error: null })
    const insertItem = makeQueryBuilder({ data: null, error: null })
    queueTables({
      meal_plans: [planUpsert],
      meal_plan_items: [listExisting, insertItem],
    })

    await addRecipeToMealPlan({
      babyId: 'baby-1',
      date: '2026-08-24',
      mealType: 'lunch',
      recipeId: 'recipe-y',
      replaceExisting: false,
      weekStart: '2026-08-24',
    })

    expect(insertItem.insert).toHaveBeenCalledWith(
      expect.objectContaining({ position: 3, recipe_id: 'recipe-y' }),
    )
  })

  it('propaga erro ao consultar posições existentes', async () => {
    const planUpsert = makeQueryBuilder({ data: { id: 'plan-1' }, error: null })
    const listExisting = makeQueryBuilder({ data: null, error: new Error('read fail') })
    queueTables({
      meal_plans: [planUpsert],
      meal_plan_items: [listExisting],
    })

    await expect(
      addRecipeToMealPlan({
        babyId: 'baby-1',
        date: '2026-08-24',
        mealType: 'lunch',
        recipeId: 'recipe-y',
        replaceExisting: false,
        weekStart: '2026-08-24',
      }),
    ).rejects.toThrow('read fail')
  })
})

describe('duplicateMealPlan', () => {
  it('copia itens deslocando a data pela distância entre semanas, usando utilitário local', async () => {
    // O plano de origem tem itens em três dias distintos; verifica que cada um
    // é deslocado corretamente (sem depender de T12:00 injetado à mão nem de
    // toISOString, que sofre com fusos negativos).
    const source: MealPlan = {
      id: 'plan-source',
      user_id: 'user-1',
      baby_id: 'baby-1',
      week_start: '2026-08-24',
      created_at: '',
      updated_at: '',
      meal_plan_items: [
        {
          id: 'i1',
          meal_plan_id: 'plan-source',
          date: '2026-08-24',
          meal_type: 'breakfast',
          position: 0,
          recipe_id: 'recipe-a',
          recipe: { id: 'recipe-a' } as unknown as MealPlan['meal_plan_items'][number]['recipe'],
        },
        {
          id: 'i2',
          meal_plan_id: 'plan-source',
          date: '2026-08-27',
          meal_type: 'lunch',
          position: 0,
          recipe_id: 'recipe-b',
          recipe: { id: 'recipe-b' } as unknown as MealPlan['meal_plan_items'][number]['recipe'],
        },
        {
          id: 'i3',
          meal_plan_id: 'plan-source',
          date: '2026-08-30',
          meal_type: 'dinner',
          position: 0,
          recipe_id: 'recipe-c',
          recipe: { id: 'recipe-c' } as unknown as MealPlan['meal_plan_items'][number]['recipe'],
        },
      ],
    }

    const sourcePlanRead = makeQueryBuilder({ data: source, error: null })
    const targetPlanUpsert = makeQueryBuilder({ data: { id: 'plan-target' }, error: null })
    const deleteItems = makeQueryBuilder({ data: null, error: null })
    const insertItems = makeQueryBuilder({ data: null, error: null })
    queueTables({
      meal_plans: [sourcePlanRead, targetPlanUpsert],
      meal_plan_items: [deleteItems, insertItems],
    })

    const newPlanId = await duplicateMealPlan('baby-1', '2026-08-24', '2026-08-31')

    expect(newPlanId).toBe('plan-target')
    const insertedRows = insertItems.insert.mock.calls[0]?.[0] as Array<{ date: string }>
    expect(insertedRows.map((row) => row.date)).toEqual([
      '2026-08-31', // 2026-08-24 + 7
      '2026-09-03', // 2026-08-27 + 7
      '2026-09-06', // 2026-08-30 + 7
    ])
  })

  it('lança erro descritivo quando a semana de origem não existe', async () => {
    const sourcePlanRead = makeQueryBuilder({ data: null, error: null })
    queueTables({ meal_plans: [sourcePlanRead] })

    await expect(
      duplicateMealPlan('baby-1', '2026-08-24', '2026-08-31'),
    ).rejects.toThrow('Semana de origem não encontrada')
  })
})
