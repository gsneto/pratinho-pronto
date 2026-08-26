import { useSyncExternalStore } from 'react'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

interface InstallState {
  canInstall: boolean
  isInstalled: boolean
  isIos: boolean
}

let deferredPrompt: InstallPromptEvent | null = null
let initialized = false
const listeners = new Set<() => void>()

function detectInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as NavigatorWithStandalone).standalone === true
  )
}

function detectIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

let snapshot: InstallState = {
  canInstall: false,
  isInstalled: false,
  isIos: false,
}

function updateSnapshot() {
  snapshot = {
    canInstall: deferredPrompt !== null,
    isInstalled: detectInstalled(),
    isIos: detectIos(),
  }
  listeners.forEach((listener) => listener())
}

export function initializePwaInstall() {
  if (initialized) return
  initialized = true
  updateSnapshot()

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as InstallPromptEvent
    updateSnapshot()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    updateSnapshot()
  })

  window.matchMedia('(display-mode: standalone)').addEventListener('change', updateSnapshot)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePwaInstall() {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => snapshot)

  async function install() {
    if (!deferredPrompt) return 'unavailable' as const

    const prompt = deferredPrompt
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    deferredPrompt = null
    updateSnapshot()
    return outcome
  }

  return { ...state, install }
}
