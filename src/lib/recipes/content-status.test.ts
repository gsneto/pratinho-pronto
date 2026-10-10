import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('shouldShowDemoBadge', () => {
  it('esconde o selo de demonstração fora do modo de QA', async () => {
    vi.stubEnv('VITE_DEMO_MODE', '')
    vi.resetModules()
    const { shouldShowDemoBadge } = await import('./content-status')
    expect(shouldShowDemoBadge(true)).toBe(false)
    expect(shouldShowDemoBadge(false)).toBe(false)
  })

  it('mostra o selo apenas para receitas de demonstração no modo de QA', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true')
    vi.resetModules()
    const { shouldShowDemoBadge } = await import('./content-status')
    expect(shouldShowDemoBadge(true)).toBe(true)
    expect(shouldShowDemoBadge(false)).toBe(false)
  })
})
