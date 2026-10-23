import { queryOptions } from '@tanstack/react-query'
import { nftKeys } from '@/features/catalog/queries'
import { fetchNftReviews, fetchRelatedNfts } from './api'

export const nftReviewsQuery = (nftId: string) =>
  queryOptions({
    queryKey: [...nftKeys.detail(nftId), 'reviews'] as const,
    queryFn: ({ signal }) => fetchNftReviews(nftId, signal),
    staleTime: 5 * 60_000,
  })

export const relatedNftsQuery = (nftId: string) =>
  queryOptions({
    queryKey: [...nftKeys.detail(nftId), 'related'] as const,
    queryFn: ({ signal }) => fetchRelatedNfts(nftId, signal),
    staleTime: 60_000,
  })
