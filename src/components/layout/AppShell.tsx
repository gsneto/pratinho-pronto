import { CalendarDays, Home, ListChecks, LoaderCircle, LogOut, Refrigerator, Salad, Sprout, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useBaby } from '../../hooks/useBaby'
import { getAuthErrorMessage } from '../../lib/auth-errors'
import { BabyAvatar } from '../baby/BabyAvatar'
import { BrandMark } from '../ui/BrandMark'
import { ThemeToggle } from '../ui/ThemeToggle'
import { analytics } from '../../services/analytics'

const navigation = [
  { label: 'Início', icon: Home, path: '/app' },
  { label: 'Semana', icon: CalendarDays, path: '/app/week' },
  { label: 'Receitas', icon: Salad, path: '/app/recipes' },
  { label: 'Despensa', icon: Refrigerator, path: '/app/pantry' },
  { label: 'Compras', icon: ListChecks, path: '/app/shopping-list' },
]

export function AppShell() {
  const { logout } = useAuth()
  const { data: baby } = useBaby()
  const location = useLocation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  useEffect(() => { analytics.track('app_view', { path: location.pathname }) }, [location.pathname])

  async function handleLogout() {
    setIsLoggingOut(true)
    setLogoutError(null)
    try { await logout() }
    catch (error) { setLogoutError(getAuthErrorMessage(error)); setIsLoggingOut(false) }
  }

  return (
    <div className="pp-app-shell">
      <a className="pp-skip-link" href="#app-main" tabIndex={0}>Pular para o conteúdo</a>
      <header className="pp-app-header">
        <div className="pp-app-header-inner">
          <Link className="pp-brand-link" to="/app" aria-label="Pratinho Pronto — início"><BrandMark /></Link>
          <div className="pp-header-tools">
            <ThemeToggle />
            <Link aria-label="Perfil do bebê" className="pp-profile-link" to="/app/profile">
              {baby ? <BabyAvatar name={baby.name} photoUrl={baby.photo_url} size="sm" /> : <UserRound aria-hidden="true" size={21} />}
            </Link>
            <button aria-label="Sair da conta" className="pp-icon-btn pp-logout" disabled={isLoggingOut} onClick={handleLogout} type="button">
              {isLoggingOut ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" size={18} /> : <LogOut aria-hidden="true" size={18} />}
            </button>
          </div>
        </div>
      </header>
      <div className="pp-app-workspace">
        <aside className="pp-sidebar">
          <p className="pp-nav-caption">SUA ROTINA</p>
          <nav aria-label="Navegação principal no desktop"><ul>{navigation.map(({ label, icon: Icon, path }) => <li key={path}><NavLink className="pp-side-link" end={path === '/app'} to={path}><Icon aria-hidden="true" size={21} strokeWidth={1.7} /><span>{label}</span></NavLink></li>)}<li><NavLink className="pp-side-link" to="/app/profile"><UserRound aria-hidden="true" size={21} strokeWidth={1.7} /><span>Perfil do bebê</span></NavLink></li></ul></nav>
          <div className="pp-sidebar-note"><Sprout aria-hidden="true" size={26} strokeWidth={1.4} /><p>Cada descoberta começa com um pequeno cuidado.</p><span>Vocês, no seu tempo.</span></div>
        </aside>
        <main id="app-main" className="pp-app-main" tabIndex={-1}>
          {logoutError && <p className="pp-feedback-error" role="alert">{logoutError}</p>}
          <Outlet />
          <footer className="pp-app-footer">Pratinho Pronto · Organização para a rotina alimentar. Não substitui orientação individual de pediatra ou nutricionista.</footer>
        </main>
      </div>
      <nav aria-label="Navegação principal" className="pp-bottom-nav"><ul>{navigation.map(({ label, icon: Icon, path }) => <li key={path}><NavLink className="pp-bottom-link" end={path === '/app'} to={path}><span><Icon aria-hidden="true" size={22} strokeWidth={1.8} /></span><small>{label}</small></NavLink></li>)}</ul></nav>
    </div>
  )
}
