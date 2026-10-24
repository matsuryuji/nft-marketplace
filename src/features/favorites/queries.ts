import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { privateKeys, useSession } from '@/features/auth/session'
import { toApiError } from '@/shared/api/errors'
import type { FavoritesResponse } from '@/shared/contracts/favorites'
import type { NftSummary } from '@/shared/contracts/nft'
import { addFavorite, fetchFavorites, removeFavorite } from './api'

export const favoritesKey = (userId: string) => [...privateKeys.user(userId), 'favorites'] as const

export const favoritesQuery = (userId: string) =>
  queryOptions({ queryKey: favoritesKey(userId), queryFn: ({ signal }) => fetchFavorites(signal), staleTime: 60_000 })

export function useFavorites() {
  const { user } = useSession()
  return useQuery({ ...favoritesQuery(user?.id ?? ''), enabled: Boolean(user) })
}

export function useIsFavorite(nftId: string) {
  const { data } = useFavorites()
  return data?.ids.includes(nftId) ?? false
}

type ToggleVariables = { nft: NftSummary; favorite: boolean }

function applyToggle(current: FavoritesResponse | undefined, { nft, favorite }: ToggleVariables): FavoritesResponse {
  const base = current ?? { ids: [], items: [] }
  if (favorite) {
    if (base.ids.includes(nft.id)) return base
    return { ids: [nft.id, ...base.ids], items: [nft, ...base.items] }
  }
  return { ids: base.ids.filter((id) => id !== nft.id), items: base.items.filter((item) => item.id !== nft.id) }
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const key = favoritesKey(user?.id ?? '')

  const mutation = useMutation({
    mutationFn: ({ nft, favorite }: ToggleVariables) => (favorite ? addFavorite(nft.id) : removeFavorite(nft.id)),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      queryClient.setQueryData<FavoritesResponse>(key, (current) => applyToggle(current, variables))
      return { previous }
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(key, context?.previous)
      toast.error(variables.favorite ? 'Não foi possível favoritar.' : 'Não foi possível remover dos favoritos.', {
        id: `favorite-${variables.nft.id}`,
        description: toApiError(error).message,
        action: { label: 'Tentar novamente', onClick: () => mutation.mutate(variables) },
      })
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.favorite ? `${variables.nft.name} entrou na sua lista de interesse.` : `${variables.nft.name} saiu da sua lista de interesse.`,
        { id: `favorite-${variables.nft.id}` },
      )
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: ['favorite-toggle'] }) <= 1) void queryClient.invalidateQueries({ queryKey: key })
    },
    mutationKey: ['favorite-toggle'],
  })

  return mutation
}
