import { useQuery } from '@tanstack/react-query'
import { getMealPlan } from '../services/mealPlans'

export const mealPlanQueryKey = (babyId: string, weekStart: string) => [
  'meal-plan',
  babyId,
  weekStart,
]

export function useMealPlan(babyId: string | undefined, weekStart: string) {
  return useQuery({
    enabled: Boolean(babyId && weekStart),
    queryFn: () => getMealPlan(babyId ?? '', weekStart),
    queryKey: mealPlanQueryKey(babyId ?? '', weekStart),
  })
}
