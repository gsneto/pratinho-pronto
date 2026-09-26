// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LoginPage } from './LoginPage'

vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ status: 'unauthenticated' }) }))
vi.mock('../../services/auth', () => ({ createPasswordAccess: vi.fn(), signInWithPassword: vi.fn() }))
vi.mock('../../services/analytics', () => ({ analytics: { track: vi.fn() } }))
afterEach(cleanup)

it('uses one primary heading and lets the customer reveal and rehide the password', () => {
  render(<LoginPage />)
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  const password = screen.getByLabelText('Senha') as HTMLInputElement
  expect(password.type).toBe('password')
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
  expect(password.type).toBe('text')
  fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
  expect(password.type).toBe('password')
  fireEvent.click(screen.getByRole('button', { name: 'É seu primeiro acesso? Criar senha' }))
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Crie sua senha')
  expect(screen.getByLabelText('Repita a senha')).toBeTruthy()
})
