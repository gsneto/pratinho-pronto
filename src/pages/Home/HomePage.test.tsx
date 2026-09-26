// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from './HomePage'

const state = vi.hoisted(() => ({
  plan: { data: null, isLoading: true, error: null, refetch: vi.fn() } as {
    data: null; isLoading: boolean; error: Error | null; refetch: () => void
  },
}))
vi.mock('../../hooks/useBaby', () => ({ useBaby: () => ({ data: { id: 'baby', name: 'Alice', birth_date: '2025-12-10', photo_url: null } }) }))
vi.mock('../../hooks/useMealPlan', () => ({ useMealPlan: () => state.plan }))
vi.mock('../../services/analytics', () => ({ analytics: { track: vi.fn() } }))
vi.mock('../../components/ui/InstallAppCard', () => ({ InstallAppCard: () => null }))
afterEach(cleanup)

describe('Home dashboard', () => {
  it('shows a personal daily heading and loading state, not an empty-week invitation during loading', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Pequenas refeições. Grandes descobertas.')
    expect(screen.getByText(/Carregando seu cardápio/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Montar minha semana/ })).toBeNull()
  })
})
