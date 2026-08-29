import { describe, expect, it } from 'vitest'
import { loginSchema } from './auth'

describe('loginSchema', () => {
  it('accepts and normalizes a valid email', () => {
    expect(loginSchema.parse({ email: ' mae@example.com ', password: 'segredo123' })).toEqual({
      email: 'mae@example.com',
      password: 'segredo123',
    })
  })

  it('rejects an invalid email', () => {
    expect(loginSchema.safeParse({ email: 'email-invalido' }).success).toBe(false)
  })
})
