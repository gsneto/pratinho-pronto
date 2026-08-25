import { useQuery } from '@tanstack/react-query'
import { getMyBaby } from '../services/babies'

export const babyQueryKey = ['baby'] as const

export function useBaby() {
  return useQuery({
    queryFn: getMyBaby,
    queryKey: babyQueryKey,
    staleTime: 5 * 60_000,
  })
}
