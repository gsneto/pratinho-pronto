import { describe, expect, it } from 'vitest'
import { babyFormSchema } from './baby'

const validBaby = {
  avoided_foods: '',
  birth_date: '2026-01-10',
  known_allergens: '',
  name: 'Aurora',
  notes: '',
  restrictions: '',
}

describe('babyFormSchema', () => {
  it('accepts a valid baby profile', () => {
    expect(babyFormSchema.safeParse(validBaby).success).toBe(true)
  })

  it('rejects a future birth date', () => {
    expect(
      babyFormSchema.safeParse({ ...validBaby, birth_date: '2999-01-01' }).success,
    ).toBe(false)
  })
})
