import { lazy, Suspense } from 'react'
import { AuthStateScreen } from '../components/auth/AuthStateScreen'

const LandingPage = lazy(() =>
  import('../landing/LandingPage').then(({ LandingPage }) => ({ default: LandingPage })),
)

const BabyMissingRoute = lazy(() =>
  import('../components/auth/BabyMissingRoute').then(({ BabyMissingRoute }) => ({
    default: BabyMissingRoute,
  })),
)
const BabyRequiredRoute = lazy(() =>
  import('../components/auth/BabyRequiredRoute').then(({ BabyRequiredRoute }) => ({
    default: BabyRequiredRoute,
  })),
)

const AuthCallbackPage = lazy(() =>
  import('../pages/AuthCallback/AuthCallbackPage').then(({ AuthCallbackPage }) => ({
    default: AuthCallbackPage,
  })),
)
const HomePage = lazy(() =>
  import('../pages/Home/HomePage').then(({ HomePage }) => ({ default: HomePage })),
)
const LoginPage = lazy(() =>
  import('../pages/Login/LoginPage').then(({ LoginPage }) => ({ default: LoginPage })),
)
const MealPlanPage = lazy(() =>
  import('../pages/MealPlan/MealPlanPage').then(({ MealPlanPage }) => ({
    default: MealPlanPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('../pages/NotFound/NotFoundPage').then(({ NotFoundPage }) => ({
    default: NotFoundPage,
  })),
)
const OnboardingPage = lazy(() =>
  import('../pages/Onboarding/OnboardingPage').then(({ OnboardingPage }) => ({
    default: OnboardingPage,
  })),
)
const PantryPage = lazy(() =>
  import('../pages/Pantry/PantryPage').then(({ PantryPage }) => ({
    default: PantryPage,
  })),
)
const ProfilePage = lazy(() =>
  import('../pages/Profile/ProfilePage').then(({ ProfilePage }) => ({
    default: ProfilePage,
  })),
)
const RecipeDetailsPage = lazy(() =>
  import('../pages/RecipeDetails/RecipeDetailsPage').then(
    ({ RecipeDetailsPage }) => ({ default: RecipeDetailsPage }),
  ),
)
const ShoppingListPage = lazy(() =>
  import('../pages/ShoppingList/ShoppingListPage').then(
    ({ ShoppingListPage }) => ({ default: ShoppingListPage }),
  ),
)
const RecipesPage = lazy(() =>
  import('../pages/Recipes/RecipesPage').then(({ RecipesPage }) => ({
    default: RecipesPage,
  })),
)

export function LazyAuthCallbackPage() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <AuthCallbackPage />
    </Suspense>
  )
}

export function LazyLandingPage() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <LandingPage />
    </Suspense>
  )
}

export function LazyBabyMissingRoute() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <BabyMissingRoute />
    </Suspense>
  )
}

export function LazyBabyRequiredRoute() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <BabyRequiredRoute />
    </Suspense>
  )
}

export function LazyHomePage() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <HomePage />
    </Suspense>
  )
}

export function LazyLoginPage() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <LoginPage />
    </Suspense>
  )
}

export function LazyMealPlanPage() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <MealPlanPage />
    </Suspense>
  )
}

export function LazyNotFoundPage() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <NotFoundPage />
    </Suspense>
  )
}

export function LazyOnboardingPage() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <OnboardingPage />
    </Suspense>
  )
}

export function LazyPantryPage() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <PantryPage />
    </Suspense>
  )
}

export function LazyProfilePage() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <ProfilePage />
    </Suspense>
  )
}

export function LazyRecipeDetailsPage() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <RecipeDetailsPage />
    </Suspense>
  )
}

export function LazyRecipesPage() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <RecipesPage />
    </Suspense>
  )
}

export function LazyShoppingListPage() {
  return (
    <Suspense fallback={<AuthStateScreen />}>
      <ShoppingListPage />
    </Suspense>
  )
}
