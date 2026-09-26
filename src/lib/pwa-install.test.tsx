// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'

type InstallChoice = { outcome: 'accepted' | 'dismissed'; platform: string }
let pwa: typeof import('./pwa-install')
let registeredListeners: Array<[string, EventListenerOrEventListenerObject]>
let standalone: boolean
let mediaListeners: Set<EventListenerOrEventListenerObject>

beforeEach(async () => {
  vi.resetModules()
  standalone = false
  mediaListeners = new Set()
  const media = {
    media: '(display-mode: standalone)',
    get matches() { return standalone },
    addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => mediaListeners.add(listener),
    removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => mediaListeners.delete(listener),
  }
  vi.stubGlobal('matchMedia', vi.fn(() => media))
  registeredListeners = []
  const originalAdd = window.addEventListener.bind(window)
  vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
    if (listener) registeredListeners.push([type, listener])
    originalAdd(type, listener, options)
  })
  pwa = await import('./pwa-install')
  pwa.initializePwaInstall()
})

afterEach(() => {
  cleanup()
  for (const [type, listener] of registeredListeners) window.removeEventListener(type, listener)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function offerInstall(prompt: () => Promise<InstallChoice>, userChoice: Promise<InstallChoice> = Promise.resolve({ outcome: 'dismissed', platform: '' })) {
  const event = new Event('beforeinstallprompt', { cancelable: true })
  Object.assign(event, { prompt, userChoice })
  act(() => { window.dispatchEvent(event) })
  return event
}

it('consumes a failed single-use prompt and returns a recoverable result', async () => {
  const { result } = renderHook(() => pwa.usePwaInstall())
  const prompt = vi.fn().mockRejectedValue(new Error('Platform install dialog unavailable'))
  const event = offerInstall(prompt)
  expect(event.defaultPrevented).toBe(true)
  expect(result.current.canInstall).toBe(true)
  await act(async () => {
    await expect(result.current.install()).resolves.toBe('failed')
  })
  expect(prompt).toHaveBeenCalledTimes(1)
  expect(result.current.canInstall).toBe(false)
  await act(async () => { await expect(result.current.install()).resolves.toBe('unavailable') })
  expect(prompt).toHaveBeenCalledTimes(1)
})

it('shares pending state across consumers and does not open a prompt twice', async () => {
  const first = renderHook(() => pwa.usePwaInstall())
  const second = renderHook(() => pwa.usePwaInstall())
  let finish!: (choice: InstallChoice) => void
  const choice = new Promise<InstallChoice>((resolve) => { finish = resolve })
  const prompt = vi.fn(() => choice)
  offerInstall(prompt)
  let pending!: ReturnType<typeof first.result.current.install>
  act(() => { pending = first.result.current.install() })
  expect(first.result.current.isPrompting).toBe(true)
  expect(second.result.current.isPrompting).toBe(true)
  expect(second.result.current.canInstall).toBe(false)
  await act(async () => { await expect(second.result.current.install()).resolves.toBe('busy') })
  expect(prompt).toHaveBeenCalledTimes(1)
  await act(async () => {
    finish({ outcome: 'dismissed', platform: '' })
    await expect(pending).resolves.toBe('dismissed')
  })
  expect(first.result.current.isPrompting).toBe(false)
  expect(second.result.current.isPrompting).toBe(false)
})

it('remembers appinstalled in the browser tab even before standalone mode changes', () => {
  const { result } = renderHook(() => pwa.usePwaInstall())
  offerInstall(vi.fn().mockResolvedValue({ outcome: 'dismissed', platform: '' }))
  expect(result.current.isInstalled).toBe(false)
  act(() => { window.dispatchEvent(new Event('appinstalled')) })
  expect(standalone).toBe(false)
  expect(result.current.isInstalled).toBe(true)
  expect(result.current.canInstall).toBe(false)
  offerInstall(vi.fn().mockResolvedValue({ outcome: 'dismissed', platform: '' }))
  expect(result.current.isInstalled).toBe(true)
  expect(result.current.canInstall).toBe(false)
})

it('allows a new browser offer without reusing an expired one', async () => {
  const { result } = renderHook(() => pwa.usePwaInstall())
  const first = vi.fn().mockResolvedValue({ outcome: 'dismissed', platform: '' })
  offerInstall(first)
  await act(async () => { await expect(result.current.install()).resolves.toBe('dismissed') })
  expect(result.current.canInstall).toBe(false)
  const accepted: InstallChoice = { outcome: 'accepted', platform: 'web' }
  const next = vi.fn().mockResolvedValue(accepted)
  offerInstall(next, Promise.resolve(accepted))
  await act(async () => { await expect(result.current.install()).resolves.toBe('accepted') })
  expect(first).toHaveBeenCalledTimes(1)
  expect(next).toHaveBeenCalledTimes(1)
  expect(result.current.isInstalled).toBe(false)
  expect(result.current.isPrompting).toBe(false)
})

it('preserves a fresh event delivered while an older install attempt is pending', async () => {
  const { result } = renderHook(() => pwa.usePwaInstall())
  let finish!: (choice: InstallChoice) => void
  const previous = new Promise<InstallChoice>((resolve) => { finish = resolve })
  offerInstall(vi.fn(() => previous), previous)
  let pending!: ReturnType<typeof result.current.install>
  act(() => { pending = result.current.install() })
  const fresh = vi.fn().mockResolvedValue({ outcome: 'dismissed', platform: '' })
  offerInstall(fresh)
  await act(async () => { finish({ outcome: 'dismissed', platform: '' }); await pending })
  expect(result.current.canInstall).toBe(true)
  await act(async () => { await result.current.install() })
  expect(fresh).toHaveBeenCalledTimes(1)
})

it('initializes once and follows standalone display-mode changes', () => {
  const { result } = renderHook(() => pwa.usePwaInstall())
  pwa.initializePwaInstall()
  expect(registeredListeners.filter(([type]) => type === 'beforeinstallprompt')).toHaveLength(1)
  expect(mediaListeners.size).toBe(1)
  act(() => {
    standalone = true
    for (const listener of mediaListeners) {
      if (typeof listener === 'function') listener(new Event('change'))
      else listener.handleEvent(new Event('change'))
    }
  })
  expect(result.current.isInstalled).toBe(true)
})

it('clears pending state when reading the browser choice rejects', async () => {
  const { result } = renderHook(() => pwa.usePwaInstall())
  let rejectChoice!: (reason: Error) => void
  const choice = new Promise<InstallChoice>((_resolve, reject) => { rejectChoice = reject })
  offerInstall(vi.fn().mockResolvedValue({ outcome: 'dismissed', platform: '' }), choice)
  let pending!: ReturnType<typeof result.current.install>
  await act(async () => { pending = result.current.install() })
  await act(async () => {
    rejectChoice(new Error('Browser choice unavailable'))
    await expect(pending).resolves.toBe('failed')
  })
  expect(result.current.isPrompting).toBe(false)
  expect(result.current.canInstall).toBe(false)
})




