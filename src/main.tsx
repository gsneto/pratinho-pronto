import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/fraunces/600.css'
import '@fontsource/karla/400.css'
import '@fontsource/karla/500.css'
import '@fontsource/karla/600.css'
import './index.css'
import './ui-refresh.css'
import { App } from './App'
import { initializePwaInstall } from './lib/pwa-install'
import { initializeTheme } from './lib/theme'
import { initializeAnalytics, trackOnce } from './landing/analytics'

initializeTheme()
initializePwaInstall()
initializeAnalytics()
if (window.location.pathname === '/') trackOnce('landing_view', 'landing_view')

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js?v=8', { updateViaCache: 'none' }).catch(() => undefined)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
