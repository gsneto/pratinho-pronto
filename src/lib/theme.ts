export type Theme = 'dark' | 'light'

const themeStorageKey = 'pratinho-pronto-theme'

export function resolveInitialTheme(
  storedTheme: string | null,
  prefersDark: boolean,
): Theme {
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme
  }

  return prefersDark ? 'dark' : 'light'
}

export function getCurrentTheme(): Theme {
  return resolveInitialTheme(
    window.localStorage.getItem(themeStorageKey),
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function initializeTheme() {
  applyTheme(getCurrentTheme())
}

export function saveTheme(theme: Theme) {
  window.localStorage.setItem(themeStorageKey, theme)
  applyTheme(theme)
}

