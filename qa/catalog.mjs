import { readFileSync } from 'node:fs'

// A bounded reader for this repository's seed syntax, not a SQL interpreter.
// Recipe prose comes verbatim from SQL; identifiers are explicitly QA-only.
const sqlString = "'((?:[^']|'')*)'"
const unquote = (text) => text.replaceAll("''", "'")
const words = (text) => [...text.matchAll(new RegExp(sqlString, 'g'))].map((match) => unquote(match[1]))
const slug = (name) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function loadCatalog() {
  const seed = readFileSync(new URL('../supabase/seed.sql', import.meta.url), 'utf8')
  const expansion = readFileSync(new URL('../supabase/migrations/20260826013000_expand_recipe_catalog.sql', import.meta.url), 'utf8')
  // Ingredientes são definidos tanto no seed quanto na migração de expansão
  // (que agora é autossuficiente). Deduplica por nome.
  const ingredientsByName = new Map()
  for (const match of (seed + expansion).matchAll(new RegExp(`\\(${sqlString},\\s*'(fruit|vegetable|protein|grain|dairy|seasoning|other)'\\)`, 'g'))) {
    const name = unquote(match[1])
    if (!ingredientsByName.has(name)) {
      ingredientsByName.set(name, { id: `qa-ingredient-${slug(name)}`, name, category: match[2], created_at: '2026-09-14T00:00:00Z' })
    }
  }
  const ingredients = [...ingredientsByName.values()]
  const recipes = []
  const buildRecipe = (match) => ({
    id: `qa-recipe-${slug(unquote(match[1]))}`, name: unquote(match[1]), description: unquote(match[2]),
    min_age_months: Number(match[3]), meal_type: match[4], prep_time_minutes: Number(match[5]),
    instructions: unquote(match[6]), serving_notes: unquote(match[7]), storage_notes: unquote(match[8]),
    substitutions: unquote(match[9]), image_url: null, is_active: true, is_demo: true,
    // Espelha a migração de revisão profissional: nenhuma receita de fixture é
    // marcada como revisada, porque não houve revisão real.
    content_review_status: 'pending_professional_review',
    recipe_ingredients: [], recipe_allergens: [],
  })
  const header = `\\(${sqlString},\\s*${sqlString},\\s*(\\d+),\\s*'(breakfast|lunch|snack|dinner)',\\s*(\\d+),\\s*${sqlString},\\s*${sqlString},\\s*${sqlString},\\s*${sqlString}`
  const recipeBlock = seed.split('insert into public.recipes (')[1]?.split(/\)\s*values/)[1]?.split('on conflict (name)')[0]
  if (!recipeBlock) throw new Error('Seed recipe block changed; update the QA reader.')
  for (const match of recipeBlock.matchAll(new RegExp(`${header},\\s*true\\)`, 'g'))) recipes.push(buildRecipe(match))
  const recipesByName = new Map(recipes.map((recipe) => [recipe.name, recipe]))
  function addIngredient(recipe, name, quantity, unit, optional = false) {
    const ingredient = ingredientsByName.get(name)
    if (!ingredient || !recipe) throw new Error(`QA catalog has unresolved ingredient: ${name}`)
    recipe.recipe_ingredients.push({
      id: `${recipe.id}-${ingredient.id}`, ingredient_id: ingredient.id,
      quantity, unit, is_optional: optional, ingredient,
    })
  }
  const ingredientBlock = seed.split('with recipe_data')[1]?.split('insert into public.recipe_ingredients')[0]
  for (const match of ingredientBlock.matchAll(new RegExp(`\\(${sqlString},\\s*${sqlString},\\s*([\\d.]+),\\s*${sqlString},\\s*(true|false)\\)`, 'g'))) {
    addIngredient(recipesByName.get(unquote(match[1])), unquote(match[2]), Number(match[3]), unquote(match[4]), match[5] === 'true')
  }
  const allergenBlock = seed.split('with allergen_data')[1]?.split('insert into public.recipe_allergens')[0]
  for (const match of allergenBlock.matchAll(new RegExp(`\\(${sqlString},\\s*${sqlString}\\)`, 'g'))) {
    const recipe = recipesByName.get(unquote(match[1]))
    if (!recipe) throw new Error('QA allergen has no recipe')
    recipe.recipe_allergens.push({ id: `${recipe.id}-allergen`, allergen: unquote(match[2]) })
  }
  const expansionBlock = expansion.split('insert into catalog_expansion values')[1]?.split('insert into public.recipes')[0]
  if (!expansionBlock) throw new Error('Expansion block changed; update the QA reader.')
  const expansionPattern = new RegExp(`${header},\\s*\\$json\\$([\\s\\S]*?)\\$json\\$,\\s*(array\\[[^\\]]*\\]|'\\{\\}')\\)`, 'g')
  for (const match of expansionBlock.matchAll(expansionPattern)) {
    const recipe = buildRecipe(match)
    for (const ingredient of JSON.parse(match[10])) addIngredient(recipe, ingredient.name, ingredient.quantity, ingredient.unit)
    recipe.recipe_allergens = match[11].startsWith('array') ? words(match[11]).map((allergen, index) => ({ id: `${recipe.id}-allergen-${index}`, allergen })) : []
    recipes.push(recipe)
  }
  if (recipes.length !== 72 || ingredients.length !== 36 || new Set(recipes.map((recipe) => recipe.id)).size !== 72) {
    throw new Error(`QA catalog incomplete: ${recipes.length} recipes, ${ingredients.length} ingredients`)
  }
  return { recipes: recipes.sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')), ingredients }
}
