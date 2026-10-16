import { loadCatalog } from './catalog.mjs'
import { generateWeeklyMealPlan } from '../src/lib/meal-plan/generator.ts'
import { aggregateShoppingList } from '../src/lib/shopping-list/aggregate.ts'

export const fixtureUser = { id: 'qa-user', aud: 'authenticated', role: 'authenticated', email: 'preview@example.test', app_metadata: {}, user_metadata: {}, created_at: '2026-09-14T00:00:00Z' }
export const fixtureToday = '2026-09-16T12:00:00-03:00'

// In-memory persistence for local UI testing only. No production credentials.
export function createFixtureStore(scenario = 'full') {
  const catalog = loadCatalog()
  let sequence = 0
  const timestamp = '2026-09-14T00:00:00Z'
  const baby = { id: 'qa-baby', user_id: fixtureUser.id, name: 'Alice', birth_date: '2025-12-01', restrictions: [], known_allergens: [], avoided_foods: [], notes: null, photo_path: null, photo_url: null, created_at: timestamp, updated_at: timestamp }
  const tables = { babies: scenario === 'onboarding' ? [] : [baby], recipes: catalog.recipes, ingredients: catalog.ingredients, recipe_favorites: [], meal_plans: [], meal_plan_items: [], shopping_lists: [], shopping_list_items: [] }
  const writes = []
  const fail = { reads: new Set(), writes: new Set() }
  const recipeById = new Map(catalog.recipes.map((recipe) => [recipe.id, recipe]))
  const ingredientById = new Map(catalog.ingredients.map((ingredient) => [ingredient.id, ingredient]))
  const nextId = (table) => `qa-${table}-${++sequence}`
  const matches = (row, query) => [...query].every(([key, value]) => !value.startsWith('eq.') || String(row[key]) === value.slice(3))
  // Mesmo contrato do CHECK `shopping_list_items_origin_check` do banco real:
  // exatamente uma origem — ingrediente do catálogo OU nome manual.
  const shoppingItemOriginError = (row) => {
    const hasIngredient = row.ingredient_id !== null && row.ingredient_id !== undefined
    const name = typeof row.custom_name === 'string' ? row.custom_name.trim() : ''
    if (hasIngredient && name) return 'item tem ingrediente e nome manual ao mesmo tempo'
    if (!hasIngredient && !name) return 'item sem origem (nem ingrediente nem nome manual)'
    if (!hasIngredient && name.length > 80) return 'nome manual excede 80 caracteres'
    return null
  }
  const normalizeItem = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')
  // Espelha o índice parcial único `shopping_list_items_manual_unique`: dois
  // itens manuais com o mesmo nome e unidade na mesma lista são recusados.
  const shoppingItemDuplicate = (row, ignoreId) =>
    row.ingredient_id === null &&
    tables.shopping_list_items.some((item) =>
      item.id !== ignoreId &&
      item.shopping_list_id === row.shopping_list_id &&
      item.ingredient_id === null &&
      normalizeItem(item.custom_name) === normalizeItem(row.custom_name) &&
      normalizeItem(item.unit) === normalizeItem(row.unit),
    )
  const hydrateMeal = (item) => ({ ...item, recipe: recipeById.get(item.recipe_id) })
  function hydrate(table, row) {
    if (table === 'meal_plans') return { ...row, meal_plan_items: tables.meal_plan_items.filter((item) => item.meal_plan_id === row.id).map(hydrateMeal) }
    if (table === 'shopping_lists') return { ...row, shopping_list_items: tables.shopping_list_items.filter((item) => item.shopping_list_id === row.id).map((item) => ({ custom_name: null, ...item, ingredient: ingredientById.get(item.ingredient_id) ?? null })) }
    return row
  }
  if (!['empty', 'onboarding'].includes(scenario)) {
    for (const week_start of ['2026-09-14', '2026-09-07']) {
      const plan = { id: `qa-plan-${week_start}`, user_id: fixtureUser.id, baby_id: baby.id, week_start, created_at: timestamp, updated_at: timestamp }
      tables.meal_plans.push(plan)
      const generated = generateWeeklyMealPlan({ baby, recipes: catalog.recipes, selectedMealTypes: ['breakfast', 'lunch', 'snack', 'dinner'], weekStart: week_start })
      for (const { recipe: _recipe, ...item } of generated) tables.meal_plan_items.push({ ...item, id: nextId('meal'), meal_plan_id: plan.id })
      const list = { id: `qa-list-${week_start}`, user_id: fixtureUser.id, meal_plan_id: plan.id, created_at: timestamp }
      tables.shopping_lists.push(list)
      for (const item of aggregateShoppingList(generated)) tables.shopping_list_items.push({ id: nextId('shopping-item'), shopping_list_id: list.id, ingredient_id: item.ingredient_id, quantity: item.quantity, unit: item.unit, checked: false })
    }
  }
  return {
    catalog, writes, fail,
    request(method, table, query = new URLSearchParams(), payload = {}) {
      // RPC atômica de substituição da lista de compras (equivalente local).
      if (table === 'replace_shopping_list' && method === 'POST') {
        if (fail.writes.has('replace_shopping_list')) return { status: 503, body: { message: 'Intentional local QA failure' } }
        const planId = payload.p_meal_plan_id
        const plan = tables.meal_plans.find((row) => row.id === planId && row.user_id === fixtureUser.id)
        if (!plan) return { status: 403, body: { message: 'meal_plan_not_found' } }
        let list = tables.shopping_lists.find((row) => row.meal_plan_id === planId)
        if (!list) {
          list = { id: `qa-list-${planId}`, user_id: fixtureUser.id, meal_plan_id: planId, created_at: timestamp }
          tables.shopping_lists.push(list)
        }
        // Recalcula apenas os itens DERIVADOS DO CARDÁPIO; itens manuais
        // (ingredient_id nulo) são do usuário e permanecem — mesmo contrato da
        // RPC real `replace_shopping_list`.
        tables.shopping_list_items = tables.shopping_list_items.filter(
          (item) => item.shopping_list_id !== list.id || item.ingredient_id === null,
        )
        for (const item of payload.p_items ?? []) {
          tables.shopping_list_items.push({ id: nextId('shopping-item'), shopping_list_id: list.id, ingredient_id: item.ingredient_id, custom_name: null, quantity: item.quantity, unit: item.unit, checked: false })
        }
        writes.push({ method, table, query: {}, payload: structuredClone(payload) })
        return { status: 200, body: list.id }
      }
      if (table === 'swap_meal_plan_item_positions' && method === 'POST') {
        if (fail.writes.has('swap_meal_plan_item_positions')) return { status: 503, body: { message: 'Intentional local QA failure' } }
        const first = tables.meal_plan_items.find((row) => row.id === payload.p_first)
        const second = tables.meal_plan_items.find((row) => row.id === payload.p_second)
        if (!first || !second) return { status: 403, body: { message: 'meal_plan_item_not_found' } }
        if (first.meal_plan_id !== second.meal_plan_id || first.date !== second.date || first.meal_type !== second.meal_type) {
          return { status: 400, body: { message: 'items_not_in_same_slot' } }
        }
        const swapped = first.position
        first.position = second.position
        second.position = swapped
        writes.push({ method, table, query: {}, payload: structuredClone(payload) })
        return { status: 200, body: null }
      }
      if (!(table in tables)) return { status: 501, body: { message: `Unsupported QA table: ${table}` } }
      if ((method === 'GET' ? fail.reads : fail.writes).has(table)) return { status: 503, body: { message: 'Intentional local QA failure' } }
      let rows
      if (method === 'GET') {
        rows = tables[table].filter((row) => matches(row, query))
        const order = query.get('order')
        if (order) {
          const [field, direction] = order.split('.')
          rows = [...rows].sort((left, right) => String(left[field]).localeCompare(String(right[field]), 'pt-BR') * (direction === 'desc' ? -1 : 1))
        }
        if (query.has('limit')) rows = rows.slice(0, Number(query.get('limit')))
        return { status: 200, body: structuredClone(rows.map((row) => hydrate(table, row))) }
      }
      if (['recipes', 'ingredients'].includes(table)) return { status: 405, body: { message: 'QA catalog is read-only' } }
      if (method === 'PATCH') {
        const targets = tables[table].filter((row) => matches(row, query))
        if (table === 'shopping_list_items') {
          const problem = targets.map((row) => shoppingItemOriginError({ ...row, ...payload })).find(Boolean)
          if (problem) return { status: 400, body: { message: `shopping_list_items origin violation: ${problem}` } }
          const duplicate = targets.some((row) => shoppingItemDuplicate({ ...row, ...payload }, row.id))
          if (duplicate) return { status: 409, body: { code: '23505', message: 'duplicate key value violates unique constraint "shopping_list_items_manual_unique"' } }
        }
        rows = targets
        for (const row of rows) Object.assign(row, payload)
      } else if (method === 'DELETE') {
        rows = tables[table].filter((row) => matches(row, query))
        tables[table] = tables[table].filter((row) => !matches(row, query))
      } else if (method === 'POST') {
        const uniqueKeys = { meal_plans: ['user_id', 'baby_id', 'week_start'], shopping_lists: ['meal_plan_id'], recipe_favorites: ['user_id', 'recipe_id'] }
        const keys = query.get('on_conflict')?.split(',') ?? uniqueKeys[table]
        const inputs = Array.isArray(payload) ? payload : [payload]
        const candidates = inputs.map((input) => {
          const previous = keys && tables[table].find((row) => keys.every((key) => row[key] === input[key]))
          return previous ? { ...previous, ...input } : { checked: false, ...input }
        })
        if (table === 'shopping_list_items') {
          const problem = candidates.map(shoppingItemOriginError).find(Boolean)
          if (problem) return { status: 400, body: { message: `shopping_list_items origin violation: ${problem}` } }
          const duplicate = candidates.some((candidate, index) => {
            const previous = keys && tables[table].find((row) => keys.every((key) => row[key] === inputs[index][key]))
            return shoppingItemDuplicate(candidate, previous?.id)
          })
          if (duplicate) return { status: 409, body: { code: '23505', message: 'duplicate key value violates unique constraint "shopping_list_items_manual_unique"' } }
        }
        rows = inputs.map((input) => {
          const previous = keys && tables[table].find((row) => keys.every((key) => row[key] === input[key]))
          if (previous) { Object.assign(previous, input); return previous }
          const created = { id: nextId(table), created_at: timestamp, updated_at: timestamp, ...(table === 'babies' ? { photo_path: null, photo_url: null } : {}), ...(table === 'shopping_list_items' ? { checked: false } : {}), ...input }
          tables[table].push(created)
          return created
        })
      } else return { status: 501, body: { message: `Unsupported QA method: ${method}` } }
      writes.push({ method, table, query: Object.fromEntries(query), payload: structuredClone(payload) })
      return { status: 200, body: structuredClone(rows.map((row) => hydrate(table, row))) }
    },
  }
}
