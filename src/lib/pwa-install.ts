import { useSyncExternalStore } from 'react'

interface InstallChoice {
  outcome: 'accepted' | 'dismissed'
  platform: string
}

interface InstallPromptEvent extends Event {
  prompt: () => Promise<InstallChoice>
  userChoice: Promise<InstallChoice>
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

interface InstallState {
  isPrompting: boolean
  canInstall: boolean
  isInstalled: boolean
  isIos: boolean
}

let deferredPrompt: InstallPromptEvent | null = null
let initialized = false
let isPrompting = false
let installedInSession = false
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
  isPrompting: false,
  canInstall: false,
  isInstalled: false,
  isIos: false,
}

function updateSnapshot() {
  const isInstalled = installedInSession || detectInstalled()
  snapshot = {
    isPrompting,
    canInstall: deferredPrompt !== null && !isPrompting && !isInstalled,
    isInstalled,
    isIos: detectIos(),
  }
  listeners.forEach((listener) => listener())
}

export function initializePwaInstall() {
  if (initialized) return
  initialized = true
  updateSnapshot()

  window.addEventListener('beforeinstallprompt', (event) => {
    if (snapshot.isInstalled) return
    event.preventDefault()
    deferredPrompt = event as InstallPromptEvent
    updateSnapshot()
  })

  window.addEventListener('appinstalled', () => {
    installedInSession = true
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
    if (isPrompting) return 'busy' as const
    if (!deferredPrompt || snapshot.isInstalled) return 'unavailable' as const

    // A BeforeInstallPromptEvent can be prompted only once, including failure.
    const prompt = deferredPrompt
    deferredPrompt = null
    isPrompting = true
    updateSnapshot()
    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      return outcome
    } catch {
      return 'failed' as const
    } finally {
      isPrompting = false
      updateSnapshot()
    }
  }

  return { ...state, install }
}
