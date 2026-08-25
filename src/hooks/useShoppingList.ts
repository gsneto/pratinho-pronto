import { useQuery } from '@tanstack/react-query'
import { getShoppingList } from '../services/shoppingLists'

export const shoppingListQueryKey = (mealPlanId: string) => [
  'shopping-list',
  mealPlanId,
]

export function useShoppingList(mealPlanId: string | undefined) {
  return useQuery({
    enabled: Boolean(mealPlanId),
    queryFn: () => getShoppingList(mealPlanId ?? ''),
    queryKey: shoppingListQueryKey(mealPlanId ?? ''),
  })
}
