import { describe, expect, it } from 'vitest'
import type { Recipe } from '../types/domain'
import { filterRecipes } from './recipes'

const recipes = [
  { id: '1', name: 'Banana e aveia', description: 'Rápida', meal_type: 'breakfast', prep_time_minutes: 10, min_age_months: 6 },
  { id: '2', name: 'Frango com batata', description: 'Almoço', meal_type: 'lunch', prep_time_minutes: 30, min_age_months: 8 },
  { id: '3', name: 'Maçã assada com aveia', description: 'Lanche macio', meal_type: 'snack', prep_time_minutes: 20, min_age_months: 7 },
] as Recipe[]

describe('filterRecipes', () => {
  it('combines meal, time, age and search filters', () => {
    expect(
      filterRecipes(recipes, {
        maxMinAge: 6,
        maxTime: 15,
        mealType: 'breakfast',
        search: 'banana',
      }).map((recipe) => recipe.id),
    ).toEqual(['1'])
  })

  it('busca sem depender de acento (consistente com a despensa)', () => {
    expect(filterRecipes(recipes, { search: 'maca' }).map((r) => r.id)).toEqual(['3'])
    expect(filterRecipes(recipes, { search: 'maçã' }).map((r) => r.id)).toEqual(['3'])
    expect(filterRecipes(recipes, { search: 'MAÇA' }).map((r) => r.id)).toEqual(['3'])
    expect(filterRecipes(recipes, { search: 'almoco' }).map((r) => r.id)).toEqual(['2'])
  })
})
