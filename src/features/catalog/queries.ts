import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { NftListParams } from '@/shared/contracts/nft'
import { fetchNft, fetchNfts } from './api'

export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (params: NftListParams) => [...nftKeys.lists(), params] as const,
  details: () => [...nftKeys.all, 'detail'] as const,
  detail: (nftId: string) => [...nftKeys.details(), nftId] as const,
}

export const nftListQuery = (params: NftListParams) =>
  queryOptions({
    queryKey: nftKeys.list(params),
    queryFn: ({ signal }) => fetchNfts(params, signal),
    placeholderData: keepPreviousData,
  })

export const nftDetailQuery = (nftId: string) =>
  queryOptions({
    queryKey: nftKeys.detail(nftId),
    queryFn: ({ signal }) => fetchNft(nftId, signal),
  })
