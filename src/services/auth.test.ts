import { describe, expect, it } from 'vitest'
import { getAuthErrorMessage } from '../lib/auth-errors'
import { buildAuthCallbackUrl } from './auth'

describe('auth service helpers', () => {
  it('builds a callback URL without duplicate slashes', () => {
    expect(buildAuthCallbackUrl('https://app.example.com/')).toBe(
      'https://app.example.com/auth/callback',
    )
  })

  it('returns a safe message for rate limiting', () => {
    expect(getAuthErrorMessage(new Error('Email rate limit exceeded'))).toContain(
      'Muitas tentativas',
    )
  })

  it('does not expose unknown provider errors', () => {
    expect(getAuthErrorMessage(new Error('sensitive provider detail'))).not.toContain(
      'sensitive provider detail',
    )
  })
})
