import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { privateKeys, useSession } from '@/features/auth/session'
import type { UpsertWalletRequest, WalletProvider, WalletSlot } from '@/shared/contracts/wallet'
import { connectWallet, disconnectWallet, fetchWallets, fetchWalletSession, upsertWallet } from './api'

export const walletKeys = {
  list: (userId: string) => [...privateKeys.user(userId), 'wallets'] as const,
  session: (userId: string) => [...privateKeys.user(userId), 'wallet-session'] as const,
}

export const walletsQuery = (userId: string) =>
  queryOptions({ queryKey: walletKeys.list(userId), queryFn: ({ signal }) => fetchWallets(signal), staleTime: 60_000 })

export const walletSessionQuery = (userId: string) =>
  queryOptions({
    queryKey: walletKeys.session(userId),
    queryFn: ({ signal }) => fetchWalletSession(signal),
    staleTime: 30_000,
  })

function useUserId() {
  const { user } = useSession()
  return user?.id ?? ''
}

export function useWallets() {
  const userId = useUserId()
  return useQuery({ ...walletsQuery(userId), enabled: Boolean(userId) })
}

export function useWalletSession() {
  const userId = useUserId()
  return useQuery({ ...walletSessionQuery(userId), enabled: Boolean(userId) })
}

export function useUpsertWallet() {
  const queryClient = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: ({ slot, body }: { slot: WalletSlot; body: UpsertWalletRequest }) => upsertWallet(slot, body),
    onSuccess: (wallets) => {
      queryClient.setQueryData(walletKeys.list(userId), wallets)
      void queryClient.invalidateQueries({ queryKey: walletKeys.session(userId) })
    },
  })
}

export function useConnectWallet() {
  const queryClient = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: ({ walletId, provider }: { walletId: string; provider: WalletProvider }) => connectWallet(walletId, provider),
    onSuccess: (session) => queryClient.setQueryData(walletKeys.session(userId), session),
  })
}

export function useDisconnectWallet() {
  const queryClient = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: disconnectWallet,
    onSuccess: () => queryClient.setQueryData(walletKeys.session(userId), null),
  })
}
