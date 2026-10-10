import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL('./migrations/20260826013000_expand_recipe_catalog.sql', import.meta.url),
  'utf8',
)
const seed = readFileSync(new URL('./seed.sql', import.meta.url), 'utf8')

const catalogSection = migration.match(
  /insert into catalog_expansion values([\s\S]*?)\n\ninsert into public\.recipes/,
)?.[1]

if (!catalogSection) throw new Error('Bloco catalog_expansion não encontrado')

const recipeHeaders = [...catalogSection.matchAll(
  /^\s*\('([^']+)',\s*'[^']+',\s*(\d+),\s*'(breakfast|lunch|snack|dinner)',\s*(\d+),$/gm,
)].map((match) => ({
  age: Number(match[2]),
  mealType: match[3],
  name: match[1],
  prepTime: Number(match[4]),
}))

const ingredientDefinitions = new Set(
  [...(seed + migration).matchAll(
    /\('([^']+)',\s*'(?:fruit|vegetable|protein|grain|dairy|seasoning|other)'\)/g,
  )].map((match) => match[1]),
)

const ingredientLists = [...catalogSection.matchAll(/\$json\$([\s\S]*?)\$json\$/g)]
  .map((match) => JSON.parse(match[1]) as Array<{ name: string; quantity: number; unit: string }>)

// Ingredientes definidos por cada arquivo (não os referenciados nos JSON).
const ingredientPattern = /\('([^']+)',\s*'(?:fruit|vegetable|protein|grain|dairy|seasoning|other)'\)/g
const migrationIngredients = new Set([...migration.matchAll(ingredientPattern)].map((m) => m[1]))
const seedIngredients = new Set([...seed.matchAll(ingredientPattern)].map((m) => m[1]))
const usedIngredients = new Set(ingredientLists.flat().map((item) => item.name))

describe('catálogo expandido de receitas', () => {
  it('adiciona 48 receitas únicas e completa um catálogo de 72', () => {
    expect(recipeHeaders).toHaveLength(48)
    expect(new Set(recipeHeaders.map((recipe) => recipe.name))).toHaveLength(48)
  })

  it('distribui 12 novas receitas por tipo de refeição', () => {
    const counts = Object.groupBy(recipeHeaders, (recipe) => recipe.mealType)

    expect(Object.fromEntries(
      Object.entries(counts).map(([key, recipes]) => [key, recipes?.length ?? 0]),
    )).toEqual({ breakfast: 12, dinner: 12, lunch: 12, snack: 12 })
  })

  it('mantém idade e tempo de preparo em intervalos válidos', () => {
    expect(recipeHeaders.every((recipe) => recipe.age >= 6 && recipe.age <= 9)).toBe(true)
    expect(recipeHeaders.every((recipe) => recipe.prepTime > 0 && recipe.prepTime <= 40)).toBe(true)
  })

  it('define ao menos dois ingredientes válidos para cada receita', () => {
    expect(ingredientLists).toHaveLength(48)
    expect(ingredientLists.every((items) => items.length >= 2)).toBe(true)
    expect(ingredientLists.flat().every((item) => ingredientDefinitions.has(item.name))).toBe(true)
    expect(ingredientLists.flat().every((item) => item.quantity > 0 && item.unit.length > 0)).toBe(true)
  })

  it('não usa açúcar nem mel como ingredientes', () => {
    const forbidden = /^(açúcar|mel|melado|adoçante)$/i
    expect(ingredientLists.flat().some((item) => forbidden.test(item.name))).toBe(false)
  })

  it('é autossuficiente em ingredientes (não depende do seed rodar antes)', () => {
    // O Supabase aplica migrações ANTES do seed. Se a migração não definir todos
    // os ingredientes que suas receitas usam, uma base limpa fica com receitas
    // sem vínculo de ingrediente.
    const missingInMigration = [...usedIngredients].filter((name) => !migrationIngredients.has(name))
    expect(missingInMigration).toEqual([])
    // E a migração deve cobrir tudo o que o seed define (senão o seed, que roda
    // depois, precisaria recriar ingredientes que a migração já deveria ter).
    const seedNotInMigration = [...seedIngredients].filter((name) => !migrationIngredients.has(name))
    expect(seedNotInMigration).toEqual([])
  })
})
