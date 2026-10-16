import { expect, it } from 'vitest'
import { createFixtureStore } from './store.mjs'

it('preserves a local replacement when the UI reloads the saved plan', () => {
  const store = createFixtureStore()
  const initial = store.request('GET', 'meal_plans', new URLSearchParams({ week_start: 'eq.2026-09-14' }))
  expect(initial.status).toBe(200)
  const item = initial.body[0].meal_plan_items[0]
  const recipe = store.catalog.recipes.find((entry) => entry.meal_type === item.meal_type && entry.id !== item.recipe_id)
  expect(store.request('PATCH', 'meal_plan_items', new URLSearchParams({ id: `eq.${item.id}` }), { recipe_id: recipe.id }).status).toBe(200)
  expect(store.request('GET', 'meal_plans', new URLSearchParams({ week_start: 'eq.2026-09-14' })).body[0].meal_plan_items[0].recipe.id).toBe(recipe.id)
})

it('isolates fixtures and fails unknown endpoints instead of claiming success', () => {
  const first = createFixtureStore()
  const second = createFixtureStore()
  first.request('PATCH', 'babies', new URLSearchParams(), { name: 'Local edit' })
  expect(second.request('GET', 'babies', new URLSearchParams()).body[0].name).toBe('Alice')
  expect(first.request('GET', 'unknown_table', new URLSearchParams()).status).toBe(501)
})

it('supports empty onboarding and marks a fixture shopping item only after a write', () => {
  const empty = createFixtureStore('onboarding')
  expect(empty.request('GET', 'babies', new URLSearchParams()).body).toEqual([])
  const store = createFixtureStore()
  const list = store.request('GET', 'shopping_lists', new URLSearchParams()).body[0]
  const item = list.shopping_list_items[0]
  store.request('PATCH', 'shopping_list_items', new URLSearchParams({ id: `eq.${item.id}` }), { checked: true })
  expect(store.request('GET', 'shopping_lists', new URLSearchParams()).body[0].shopping_list_items[0].checked).toBe(true)
})

it('recalculating the list preserves manual items and replaces catalog items', () => {
  const store = createFixtureStore()
  const list = store.request('GET', 'shopping_lists', new URLSearchParams()).body[0]
  const plan = store.request('GET', 'meal_plans', new URLSearchParams({ week_start: 'eq.2026-09-14' })).body[0]
  const catalogCount = list.shopping_list_items.length

  const created = store.request('POST', 'shopping_list_items', new URLSearchParams(), {
    shopping_list_id: list.id, ingredient_id: null, custom_name: 'Fraldas', quantity: 1, unit: 'pacote', checked: true,
  })
  expect(created.status).toBe(200)

  const result = store.request('POST', 'replace_shopping_list', new URLSearchParams(), {
    p_meal_plan_id: plan.id,
    p_items: [{ ingredient_id: 'qa-ingredient-banana', quantity: 2, unit: 'unidade' }],
  })
  expect(result.status).toBe(200)

  const after = store.request('GET', 'shopping_lists', new URLSearchParams()).body[0].shopping_list_items
  const manual = after.filter((item) => item.ingredient_id === null)
  expect(manual).toHaveLength(1)
  expect(manual[0].custom_name).toBe('Fraldas')
  expect(manual[0].checked).toBe(true)
  // Itens do catálogo foram recalculados: apenas o novo item do cardápio.
  expect(after.filter((item) => item.ingredient_id !== null)).toHaveLength(1)
  expect(after.length).toBeLessThan(catalogCount + 1)
})

it('rejects shopping items without a valid origin, mirroring the database check', () => {
  const store = createFixtureStore()
  const list = store.request('GET', 'shopping_lists', new URLSearchParams()).body[0]
  const noOrigin = store.request('POST', 'shopping_list_items', new URLSearchParams(), {
    shopping_list_id: list.id, ingredient_id: null, custom_name: null, quantity: 1, unit: 'unidade',
  })
  expect(noOrigin.status).toBe(400)
  const bothOrigins = store.request('POST', 'shopping_list_items', new URLSearchParams(), {
    shopping_list_id: list.id, ingredient_id: 'qa-ingredient-banana', custom_name: 'Banana', quantity: 1, unit: 'unidade',
  })
  expect(bothOrigins.status).toBe(400)
})

it('recusa item manual duplicado, espelhando o índice único do banco', () => {
  const store = createFixtureStore()
  const list = store.request('GET', 'shopping_lists', new URLSearchParams()).body[0]
  const first = store.request('POST', 'shopping_list_items', new URLSearchParams(), {
    shopping_list_id: list.id, ingredient_id: null, custom_name: 'Fraldas', quantity: 1, unit: 'pacote',
  })
  expect(first.status).toBe(200)
  const duplicate = store.request('POST', 'shopping_list_items', new URLSearchParams(), {
    shopping_list_id: list.id, ingredient_id: null, custom_name: 'fraldas', quantity: 1, unit: 'Pacote',
  })
  expect(duplicate.status).toBe(409)
  expect(duplicate.body.code).toBe('23505')
})

it('swaps two meal positions atomically and refuses mismatched slots', () => {
  const store = createFixtureStore()
  const plan = store.request('GET', 'meal_plans', new URLSearchParams({ week_start: 'eq.2026-09-14' })).body[0]
  const breakfasts = plan.meal_plan_items.filter((item) => item.meal_type === 'breakfast' && item.date === plan.week_start)
  const lunches = plan.meal_plan_items.filter((item) => item.meal_type === 'lunch' && item.date === plan.week_start)
  expect(breakfasts).toHaveLength(1)

  // Adiciona uma segunda refeição no mesmo slot para ter o que trocar.
  const extra = store.request('POST', 'meal_plan_items', new URLSearchParams(), {
    meal_plan_id: plan.id, recipe_id: breakfasts[0].recipe_id, date: plan.week_start, meal_type: 'breakfast', position: 1,
  }).body[0]

  const before = store.request('GET', 'meal_plans', new URLSearchParams({ week_start: 'eq.2026-09-14' })).body[0]
    .meal_plan_items.filter((item) => item.meal_type === 'breakfast' && item.meal_plan_id === plan.id && item.date === plan.week_start).sort((a, b) => a.position - b.position)
  const result = store.request('POST', 'swap_meal_plan_item_positions', new URLSearchParams(), {
    p_first: before[0].id, p_second: before[1].id,
  })
  expect(result.status).toBe(200)
  const after = store.request('GET', 'meal_plans', new URLSearchParams({ week_start: 'eq.2026-09-14' })).body[0]
    .meal_plan_items.filter((item) => item.meal_type === 'breakfast' && item.meal_plan_id === plan.id && item.date === plan.week_start).sort((a, b) => a.position - b.position)
  expect(after.map((item) => item.id)).toEqual([extra.id, before[0].id])

  const mismatch = store.request('POST', 'swap_meal_plan_item_positions', new URLSearchParams(), {
    p_first: before[0].id, p_second: lunches[0].id,
  })
  expect(mismatch.status).toBe(400)
})
