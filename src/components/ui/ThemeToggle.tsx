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
      aria-pressed={isDark}
      className="relative grid h-11 w-[76px] shrink-0 grid-cols-2 items-center rounded-2xl border border-cream-100 bg-cream-50 p-1 text-ink-500 transition-colors"
      onClick={handleToggle}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`absolute left-1 top-1 size-9 rounded-xl bg-white shadow-sm transition-transform duration-200 ease-out ${
          isDark ? 'translate-x-8' : 'translate-x-0'
        }`}
      />
      <Sun
        aria-hidden="true"
        className={`relative z-10 justify-self-center transition-colors ${
          isDark ? 'text-ink-500' : 'text-sage-700'
        }`}
        size={18}
        strokeWidth={1.8}
      />
      <Moon
        aria-hidden="true"
        className={`relative z-10 justify-self-center transition-colors ${
          isDark ? 'text-sage-700' : 'text-ink-500'
        }`}
        size={18}
        strokeWidth={1.8}
      />
    </button>
  )
}
