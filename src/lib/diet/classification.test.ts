import { describe, expect, it } from 'vitest'
import type { Recipe } from '../../types/domain'
import {
  classifyIngredient,
  parseDietaryRestrictions,
  recipeViolatesDiet,
} from './classification'

function recipeWithIngredient(name: string): Recipe {
  return {
    id: `r-${name}`,
    recipe_ingredients: [
      { id: 'ri', ingredient_id: 'i', ingredient: { id: 'i', name } },
    ],
  } as unknown as Recipe
}

describe('classifyIngredient', () => {
  it('classifica carnes e peixes como animal_flesh', () => {
    expect(classifyIngredient('Carne bovina')).toBe('animal_flesh')
    expect(classifyIngredient('Frango')).toBe('animal_flesh')
    expect(classifyIngredient('Peixe')).toBe('animal_flesh')
    expect(classifyIngredient('Peru')).toBe('animal_flesh')
  })

  it('classifica ovo e laticínio como animal_product', () => {
    expect(classifyIngredient('Ovo')).toBe('animal_product')
    expect(classifyIngredient('Iogurte natural')).toBe('animal_product')
  })

  it('classifica vegetais, frutas, grãos e leguminosas como plant', () => {
    expect(classifyIngredient('Lentilha')).toBe('plant')
    expect(classifyIngredient('Grão-de-bico')).toBe('plant')
    expect(classifyIngredient('Feijão')).toBe('plant')
    expect(classifyIngredient('Maçã')).toBe('plant')
  })

  it('normaliza acento e caixa', () => {
    expect(classifyIngredient('MAÇÃ')).toBe('plant')
    expect(classifyIngredient('  Ovo ')).toBe('animal_product')
  })

  it('retorna unknown para ingrediente não classificado', () => {
    expect(classifyIngredient('Ingrediente misterioso')).toBe('unknown')
  })
})

describe('parseDietaryRestrictions', () => {
  it('reconhece vegetariano', () => {
    const rule = parseDietaryRestrictions(['Vegetariano'])
    expect(rule?.label).toBe('vegetariano')
    expect(rule?.excludes.has('animal_flesh')).toBe(true)
    expect(rule?.excludes.has('animal_product')).toBe(false)
  })

  it('reconhece vegano (mais restritivo)', () => {
    const rule = parseDietaryRestrictions(['vegana'])
    expect(rule?.excludes.has('animal_flesh')).toBe(true)
    expect(rule?.excludes.has('animal_product')).toBe(true)
  })

  it('ignora restrições não dietéticas e termos ambíguos', () => {
    expect(parseDietaryRestrictions(['sem leite', 'sem carne'])).toBeNull()
    expect(parseDietaryRestrictions([])).toBeNull()
  })
})

describe('recipeViolatesDiet', () => {
  const vegetarian = parseDietaryRestrictions(['vegetariano'])!
  const vegan = parseDietaryRestrictions(['vegano'])!

  it('vegetariano exclui carne, mas permite ovo', () => {
    expect(recipeViolatesDiet(recipeWithIngredient('Carne bovina'), vegetarian)).toBe(true)
    expect(recipeViolatesDiet(recipeWithIngredient('Ovo'), vegetarian)).toBe(false)
  })

  it('vegano exclui carne e ovo', () => {
    expect(recipeViolatesDiet(recipeWithIngredient('Ovo'), vegan)).toBe(true)
    expect(recipeViolatesDiet(recipeWithIngredient('Lentilha'), vegan)).toBe(false)
  })

  it('trata ingrediente desconhecido como não seguro', () => {
    expect(recipeViolatesDiet(recipeWithIngredient('Ingrediente novo'), vegetarian)).toBe(true)
  })
})
