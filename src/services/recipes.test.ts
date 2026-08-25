import { describe, expect, it } from 'vitest'
import type { Recipe } from '../types/domain'
import { filterRecipes } from './recipes'

const recipes = [
  { id: '1', name: 'Banana e aveia', description: 'Rápida', meal_type: 'breakfast', prep_time_minutes: 10, min_age_months: 6 },
  { id: '2', name: 'Frango com batata', description: 'Almoço', meal_type: 'lunch', prep_time_minutes: 30, min_age_months: 8 },
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
})
