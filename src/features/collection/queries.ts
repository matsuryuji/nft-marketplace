import { queryOptions, useQuery } from '@tanstack/react-query'
import { privateKeys, useSession } from '@/features/auth/session'
import { fetchCollection } from './api'

export const collectionKey = (userId: string) => [...privateKeys.user(userId), 'collection'] as const

export const collectionQuery = (userId: string) =>
  queryOptions({ queryKey: collectionKey(userId), queryFn: ({ signal }) => fetchCollection(signal), staleTime: 60_000 })

export function useCollection() {
  const { user } = useSession()
  return useQuery({ ...collectionQuery(user?.id ?? ''), enabled: Boolean(user) })
}
