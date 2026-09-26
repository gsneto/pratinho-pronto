// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ logout: vi.fn(), user: { email: 'teste@example.test' } }) }))
vi.mock('../../hooks/useBaby', () => ({ useBaby: () => ({ data: { name: 'Alice', photo_url: null } }) }))
vi.mock('../ui/ThemeToggle', () => ({ ThemeToggle: () => <button type="button">Tema</button> }))
vi.mock('../../services/analytics', () => ({ analytics: { track: vi.fn() } }))
afterEach(cleanup)
it('offers a skip link and direct pantry access without removing existing destinations', () => {
  render(<MemoryRouter initialEntries={['/app/pantry']}><AppShell /></MemoryRouter>)
  const skipLink = screen.getByRole('link', { name: 'Pular para o conteúdo' })
  expect(skipLink.getAttribute('href')).toBe('#app-main')
  expect(skipLink.getAttribute('tabindex')).toBe('0')
  expect(screen.getAllByRole('link', { name: /Despensa/ }).some((link) => link.getAttribute('href') === '/app/pantry')).toBe(true)
  expect(screen.getAllByRole('link', { name: /Compras/ }).length).toBeGreaterThan(0)
  expect(screen.getAllByRole('link', { name: /Perfil/ }).length).toBeGreaterThan(0)
})
