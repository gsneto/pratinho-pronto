// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { testBaby } from '../../test/fixtures'
import { ProfilePage } from './ProfilePage'
import { updateBaby } from '../../services/babies'

vi.mock('../../hooks/useBaby', () => ({ useBaby: () => ({ data: testBaby, isLoading: false }), babyQueryKey: ['baby'] }))
vi.mock('../../components/ui/InstallAppCard', () => ({ InstallAppCard: () => null }))
vi.mock('../../components/baby/BabyPhotoEditor', () => ({ BabyPhotoEditor: () => null }))
vi.mock('../../services/babies', () => ({ updateBaby: vi.fn().mockResolvedValue(undefined) }))
afterEach(cleanup)
it('announces a successful profile save using a status region', async () => {
  render(<QueryClientProvider client={new QueryClient()}><ProfilePage /></QueryClientProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  expect((await screen.findByRole('status')).textContent).toContain('Informações atualizadas.')
  expect(updateBaby).toHaveBeenCalledWith(testBaby.id, expect.objectContaining({ name: testBaby.name }))
})
