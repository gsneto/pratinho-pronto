// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OnboardingPage } from './OnboardingPage'

vi.mock('../../services/babies', () => ({ createBaby: vi.fn(), uploadBabyPhoto: vi.fn() }))
vi.mock('../../services/analytics', () => ({ analytics: { track: vi.fn() } }))
afterEach(cleanup)
it('explains the short setup while keeping every existing preference editable', () => {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><OnboardingPage /></MemoryRouter></QueryClientProvider>)
  expect(screen.getByText('Um cadastro, uma rotina mais sua.')).toBeTruthy()
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Vamos conhecer seu bebê')
  for (const label of ['Nome do bebê', 'Data de nascimento', 'Restrições alimentares', 'Alergênicos conhecidos', 'Alimentos que prefere evitar']) {
    expect(screen.getByLabelText(label)).toBeTruthy()
  }
  expect(screen.getByRole('button', { name: 'Salvar e personalizar' })).toBeTruthy()
})
