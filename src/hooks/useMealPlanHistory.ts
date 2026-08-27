import { useQuery } from '@tanstack/react-query'
import { listMealPlanHistory } from '../services/mealPlans'

export const mealPlanHistoryQueryKey = (babyId: string) => ['meal-plan-history', babyId]

export function useMealPlanHistory(babyId: string | undefined) {
  return useQuery({
    enabled: Boolean(babyId),
    queryFn: () => listMealPlanHistory(babyId ?? ''),
    queryKey: mealPlanHistoryQueryKey(babyId ?? ''),
    staleTime: 60_000,
  })
}
