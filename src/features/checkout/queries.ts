import { queryOptions, useQuery } from '@tanstack/react-query'
import { privateKeys, useSession } from '@/features/auth/session'
import { createQuote, fetchOrder } from './api'

export const ORDER_POLL_MS = 1_500

export const checkoutKeys = {
  quote: (userId: string) => [...privateKeys.user(userId), 'quote'] as const,
  order: (userId: string, orderId: string) => [...privateKeys.user(userId), 'orders', orderId] as const,
}

export const quoteQuery = (userId: string) =>
  queryOptions({
    queryKey: checkoutKeys.quote(userId),
    queryFn: () => createQuote(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  })

export const orderQuery = (userId: string, orderId: string) =>
  queryOptions({
    queryKey: checkoutKeys.order(userId, orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? ORDER_POLL_MS : false),
  })

export function useQuote() {
  const { user } = useSession()
  return useQuery({ ...quoteQuery(user?.id ?? ''), enabled: Boolean(user) })
}

export function useOrder(orderId: string) {
  const { user } = useSession()
  return useQuery({ ...orderQuery(user?.id ?? '', orderId), enabled: Boolean(user) })
}
