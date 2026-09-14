import {
  CalendarDays,
  Home,
  ListChecks,
  LoaderCircle,
  LogOut,
  Salad,
  UserRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useBaby } from '../../hooks/useBaby'
import { getAuthErrorMessage } from '../../lib/auth-errors'
import { BabyAvatar } from '../baby/BabyAvatar'
import { BrandMark } from '../ui/BrandMark'
import { ThemeToggle } from '../ui/ThemeToggle'
import { analytics } from '../../services/analytics'

const navigation = [
  { label: 'Início', icon: Home, path: '/app', enabled: true },
  { label: 'Semana', icon: CalendarDays, path: '/app/week', enabled: true },
  { label: 'Receitas', icon: Salad, path: '/app/recipes', enabled: true },
  { label: 'Compras', icon: ListChecks, path: '/app/shopping-list', enabled: true },
  { label: 'Perfil', icon: UserRound, path: '/app/profile', enabled: true },
]

export function AppShell() {
  const { logout, user } = useAuth()
  const { data: baby } = useBaby()
  const location = useLocation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  useEffect(() => {
    analytics.track('app_view', { path: location.pathname })
  }, [location.pathname])

  async function handleLogout() {
    setIsLoggingOut(true)
    setLogoutError(null)

    try {
      await logout()
    } catch (error) {
      setLogoutError(getAuthErrorMessage(error))
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-28 text-ink-900 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-cream-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
          <BrandMark />
          <nav aria-label="Navegação principal no desktop" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {navigation.filter((item) => item.enabled).map(({ label, path }) => (
                <li key={label}>
                  <NavLink
                    className={({ isActive }) =>
                      `flex min-h-11 items-center rounded-[14px] px-3 text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-sage-50 text-sage-700'
                          : 'text-ink-500 hover:bg-cream-50 hover:text-ink-900'
                      }`
                    }
                    end={path === '/app'}
                    to={path}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-56 truncate text-xs text-ink-500 lg:block">
              {user?.email}
            </span>
            <ThemeToggle />
            <button
              aria-label="Sair da conta"
              className="pp-btn pp-btn-outline pp-btn-sm gap-2 px-3 sm:px-4"
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
            >
              {isLoggingOut ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                  size={18}
                />
              ) : (
                <LogOut aria-hidden="true" size={18} />
              )}
              <span className="hidden sm:inline">{isLoggingOut ? 'Saindo…' : 'Sair'}</span>
            </button>
          </div>
        </div>
      </header>

      {logoutError && (
        <p
          className="mx-auto mt-3 max-w-6xl px-5 text-sm text-terracotta-500 sm:px-8"
          role="alert"
        >
          {logoutError}
        </p>
      )}

      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="mx-auto hidden max-w-6xl border-t border-cream-100 px-8 py-6 text-sm leading-6 text-ink-500 md:block">
        O Pratinho Pronto é uma ferramenta de organização alimentar e não
        substitui orientação individual de pediatra ou nutricionista.
      </footer>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <div className="mx-auto max-w-lg rounded-full border border-cream-100 bg-white/95 p-1.5 shadow-[var(--pp-shadow-lifted)] backdrop-blur">
          <ul className="grid grid-cols-5 gap-1">
            {navigation.map(({ label, icon: Icon, path, enabled }) => (
              <li key={label}>
                {enabled ? (
                  <NavLink
                    className={({ isActive }) =>
                      `flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[10px] font-semibold transition-colors ${
                        isActive
                          ? 'bg-sage-100 text-sage-700'
                          : 'text-ink-500 hover:bg-cream-50 hover:text-ink-900'
                      }`
                    }
                    end={path === '/app'}
                    to={path}
                  >
                    {label === 'Perfil' && baby?.photo_url ? (
                      <BabyAvatar
                        className="!rounded-full"
                        name={baby.name}
                        photoUrl={baby.photo_url}
                        size="sm"
                      />
                    ) : (
                      <Icon aria-hidden="true" size={19} strokeWidth={1.9} />
                    )}
                    <span>{label}</span>
                  </NavLink>
                ) : (
                  <span
                    aria-disabled="true"
                    className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[10px] font-semibold text-ink-500/60"
                  >
                    <Icon aria-hidden="true" size={19} strokeWidth={1.9} />
                    <span>{label}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  )
}
