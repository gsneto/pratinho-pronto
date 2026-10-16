/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Guarda de integridade do catálogo: cada receita do SQL precisa ter uma foto
 * mapeada e um arquivo de imagem existente. Se alguém renomear uma receita sem
 * atualizar o mapa, a foto some silenciosamente — este teste falha antes.
 */
const seed = readFileSync(new URL('../../../supabase/seed.sql', import.meta.url), 'utf8')
const expansion = readFileSync(
  new URL('../../../supabase/migrations/20260826013000_expand_recipe_catalog.sql', import.meta.url),
  'utf8',
)
const imagesSource = readFileSync(new URL('./images.ts', import.meta.url), 'utf8')

function recipeNames(source: string): string[] {
  return [...source.matchAll(/\('([^']+)',\s*'[^']*',\s*\d+,\s*'(breakfast|lunch|snack|dinner)'/g)].map(
    (match) => match[1],
  )
}

const names = [...recipeNames(seed), ...recipeNames(expansion)]
const imageEntries = [...imagesSource.matchAll(/'([^']+)':\s*'(\/images\/recipes\/[^']+)'/g)].map(
  (match) => ({ name: match[1], path: match[2] }),
)
const imageByName = new Map(imageEntries.map((entry) => [entry.name, entry.path]))

describe('integridade do catálogo de receitas', () => {
  it('tem 72 receitas com nomes únicos', () => {
    expect(names).toHaveLength(72)
    expect(new Set(names).size).toBe(72)
  })

  it('mapeia uma foto para cada receita', () => {
    const withoutImage = names.filter((name) => !imageByName.has(name))
    expect(withoutImage).toEqual([])
  })

  it('não tem fotos mapeadas para receitas inexistentes', () => {
    const known = new Set(names)
    const orphans = imageEntries.map((entry) => entry.name).filter((name) => !known.has(name))
    expect(orphans).toEqual([])
  })

  it('aponta para arquivos de imagem que existem no projeto', () => {
    const missing = imageEntries
      .filter((entry) => !existsSync(new URL(`../../../public${entry.path}`, import.meta.url)))
      .map((entry) => entry.path)
    expect(missing).toEqual([])
  })
})
