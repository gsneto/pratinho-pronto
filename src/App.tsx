import { lazy, Suspense } from 'react'

const AppWithAuth = lazy(() =>
  import('./AppWithAuth').then(({ AppWithAuth: AuthenticatedApp }) => ({ default: AuthenticatedApp })),
)
const LandingPage = lazy(() =>
  import('./landing/LandingPage').then(({ LandingPage: PublicLandingPage }) => ({ default: PublicLandingPage })),
)

export function App() {
  const isPublicLanding = window.location.pathname === '/'

  return (
    <Suspense fallback={<div aria-busy="true" aria-label="Carregando Pratinho Pronto" className="min-h-screen bg-cream-50" />}>
      {isPublicLanding ? <LandingPage /> : <AppWithAuth />}
    </Suspense>
  )
}
