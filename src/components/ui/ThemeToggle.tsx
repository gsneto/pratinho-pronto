import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { getCurrentTheme, saveTheme, type Theme } from '../../lib/theme'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getCurrentTheme)
  const isDark = theme === 'dark'

  function handleToggle() {
    const nextTheme = isDark ? 'light' : 'dark'
    setTheme(nextTheme)
    saveTheme(nextTheme)
  }

  return (
    <button
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      className="grid size-11 shrink-0 place-items-center rounded-2xl border border-cream-100 bg-white text-ink-700 transition-colors hover:bg-sage-50"
      onClick={handleToggle}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      type="button"
    >
      {isDark ? (
        <Sun aria-hidden="true" size={19} strokeWidth={1.8} />
      ) : (
        <Moon aria-hidden="true" size={19} strokeWidth={1.8} />
      )}
    </button>
  )
}

