import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { Session } from '@/shared/contracts/auth'
import { fetchSession, login, logout, register } from './api'

export const sessionKeys = {
  current: () => ['session'] as const,
}

export const privateKeys = {
  all: ['me'] as const,
  user: (userId: string) => [...privateKeys.all, userId] as const,
}

export const SESSION_REVALIDATE_MS = 30_000

export const sessionQuery = () =>
  queryOptions({
    queryKey: sessionKeys.current(),
    queryFn: ({ signal }) => fetchSession(signal),
    staleTime: SESSION_REVALIDATE_MS,
  })

export function clearPrivateData(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: privateKeys.all })
}

export function applySession(queryClient: QueryClient, session: Session | null) {
  const previous = queryClient.getQueryData<Session | null>(sessionKeys.current())
  if (previous?.user.id !== session?.user.id) clearPrivateData(queryClient)
  queryClient.setQueryData(sessionKeys.current(), session)
}

export function useSession() {
  const query = useQuery(sessionQuery())
  return { session: query.data ?? null, user: query.data?.user ?? null, isPending: query.isPending }
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: login, onSuccess: (session) => applySession(queryClient, session) })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: register, onSuccess: (session) => applySession(queryClient, session) })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSettled: () => applySession(queryClient, null),
  })
}
