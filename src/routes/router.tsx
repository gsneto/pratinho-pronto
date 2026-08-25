import { Navigate, createBrowserRouter } from 'react-router-dom'
import { GuestRoute } from '../components/auth/GuestRoute'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AppShell } from '../components/layout/AppShell'
import {
  LazyAuthCallbackPage,
  LazyBabyMissingRoute,
  LazyBabyRequiredRoute,
  LazyHomePage,
  LazyLoginPage,
  LazyMealPlanPage,
  LazyNotFoundPage,
  LazyOnboardingPage,
  LazyPantryPage,
  LazyProfilePage,
  LazyRecipeDetailsPage,
  LazyRecipesPage,
  LazyShoppingListPage,
} from './LazyRoutePages'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate replace to="/app" />,
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        element: <LazyLoginPage />,
      },
    ],
  },
  {
    path: '/auth/callback',
    element: <LazyAuthCallbackPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <LazyBabyMissingRoute />,
        children: [
          {
            path: '/onboarding',
            element: <LazyOnboardingPage />,
          },
        ],
      },
      {
        element: <LazyBabyRequiredRoute />,
        children: [
          {
            path: '/app',
            element: <AppShell />,
            children: [
              {
                index: true,
                element: <LazyHomePage />,
              },
              {
                path: 'profile',
                element: <LazyProfilePage />,
              },
              {
                path: 'recipes',
                element: <LazyRecipesPage />,
              },
              {
                path: 'recipes/:recipeId',
                element: <LazyRecipeDetailsPage />,
              },
              {
                path: 'week',
                element: <LazyMealPlanPage />,
              },
              {
                path: 'pantry',
                element: <LazyPantryPage />,
              },
              {
                path: 'shopping-list',
                element: <LazyShoppingListPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <LazyNotFoundPage />,
  },
])
