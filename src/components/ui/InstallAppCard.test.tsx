// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InstallAppCard } from './InstallAppCard'

const installState = vi.hoisted(() => ({
  canInstall: false, isInstalled: false, isIos: false, isPrompting: false,
  install: vi.fn<() => Promise<'accepted' | 'dismissed' | 'unavailable' | 'busy' | 'failed'>>(),
}))
vi.mock('../../lib/pwa-install', () => ({ usePwaInstall: () => installState }))
beforeEach(() => {
  Object.assign(installState, { canInstall: false, isInstalled: false, isIos: false, isPrompting: false })
  installState.install.mockReset().mockResolvedValue('unavailable')
})
afterEach(cleanup)

it('explains an install failure and keeps manual instructions reachable', async () => {
  installState.canInstall = true
  installState.install.mockImplementation(async () => {
    installState.canInstall = false
    return 'failed'
  })
  render(<InstallAppCard />)
  fireEvent.click(screen.getByRole('button', { name: 'Instalar aplicativo' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Não foi possível abrir a instalação')
  await waitFor(() => expect((screen.getByRole('button', { name: 'Como adicionar' }) as HTMLButtonElement).disabled).toBe(false))
  expect(screen.queryByRole('button', { name: 'Abrindo instalação…' })).toBeNull()
  expect(screen.getByText('No seu navegador:')).toBeTruthy()
})

it('reflects a prompt already pending in a different card', () => {
  installState.isPrompting = true
  render(<InstallAppCard />)
  const trigger = screen.getByRole('button', { name: 'Abrindo instalação…' }) as HTMLButtonElement
  expect(trigger.disabled).toBe(true)
  expect(trigger.getAttribute('aria-busy')).toBe('true')
  fireEvent.click(trigger)
  expect(installState.install).not.toHaveBeenCalled()
  expect(screen.queryByRole('status')).toBeNull()
})

it('gives each disclosure its own heading and keyboard-accessible instructions', async () => {
  const user = userEvent.setup()
  render(<><InstallAppCard /><InstallAppCard compact /></>)
  const regions = screen.getAllByRole('region', { name: 'Tenha o Pratinho Pronto na tela inicial' })
  expect(new Set(regions.map((region) => region.getAttribute('aria-labelledby'))).size).toBe(2)
  for (const region of regions) {
    const label = document.getElementById(region.getAttribute('aria-labelledby')!)
    expect(label?.closest('section')).toBe(region)
  }
  const triggers = screen.getAllByRole('button', { name: 'Como adicionar' })
  const targets = triggers.map((trigger) => trigger.getAttribute('aria-controls'))
  expect(new Set(targets).size).toBe(2)
  for (const [index, trigger] of triggers.entries()) {
    const instructions = document.getElementById(targets[index]!)!
    expect(instructions.closest('section')).toBe(regions[index])
    expect(instructions.hidden).toBe(true)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    trigger.focus()
    await user.keyboard('{Enter}')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(instructions.hidden).toBe(false)
    await user.keyboard(' ')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(instructions.hidden).toBe(true)
  }
  expect(installState.install).not.toHaveBeenCalled()
})

it('opens manual instructions if the browser offer expires before the click is handled', async () => {
  installState.canInstall = true
  installState.install.mockImplementation(async () => {
    installState.canInstall = false
    return 'unavailable'
  })
  render(<InstallAppCard />)
  fireEvent.click(screen.getByRole('button', { name: 'Instalar aplicativo' }))
  const instructions = await screen.findByRole('status')
  expect(instructions.textContent).toContain('No seu navegador:')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByRole('button', { name: 'Como adicionar' }).getAttribute('aria-expanded')).toBe('true')
})

it.each(['accepted', 'dismissed'] as const)('does not label a %s choice as a failure or confirmed installation', async (outcome) => {
  installState.canInstall = true
  installState.install.mockResolvedValue(outcome)
  const user = userEvent.setup()
  render(<InstallAppCard />)
  const trigger = screen.getByRole('button', { name: 'Instalar aplicativo' })
  expect(trigger.hasAttribute('aria-expanded')).toBe(false)
  expect(trigger.hasAttribute('aria-controls')).toBe(false)
  await user.click(trigger)
  expect(installState.install).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.getByRole('region')).toBeTruthy()
})

it('keeps the iOS manual route available without an install API', async () => {
  installState.isIos = true
  const user = userEvent.setup()
  render(<InstallAppCard />)
  await user.click(screen.getByRole('button', { name: 'Como adicionar' }))
  expect(screen.getByRole('status').textContent).toContain('No iPhone ou iPad:')
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
  expect(installState.install).not.toHaveBeenCalled()
})

it('removes the card after the shared store confirms installation', () => {
  const { rerender } = render(<InstallAppCard />)
  expect(screen.getByRole('region')).toBeTruthy()
  installState.isInstalled = true
  rerender(<InstallAppCard />)
  expect(screen.queryByRole('region')).toBeNull()
})




