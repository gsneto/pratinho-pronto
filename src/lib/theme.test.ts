import { describe, expect, it } from 'vitest'
import { resolveInitialTheme } from './theme'

describe('resolveInitialTheme', () => {
  it('uses the saved preference first', () => {
    expect(resolveInitialTheme('light', true)).toBe('light')
    expect(resolveInitialTheme('dark', false)).toBe('dark')
  })

  it('falls back to the device preference', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark')
    expect(resolveInitialTheme(null, false)).toBe('light')
  })

  it('ignores an invalid saved value', () => {
    expect(resolveInitialTheme('unknown', true)).toBe('dark')
  })
})

