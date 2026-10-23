import { http, parseResponse } from '@/shared/api/client'
import { nftRelatedResponseSchema, nftReviewsResponseSchema } from '@/shared/contracts/nft'

export async function fetchNftReviews(nftId: string, signal?: AbortSignal) {
  const { data } = await http.get(`/nfts/${encodeURIComponent(nftId)}/reviews`, { signal })
  return parseResponse(nftReviewsResponseSchema, data)
}

export async function fetchRelatedNfts(nftId: string, signal?: AbortSignal) {
  const { data } = await http.get(`/nfts/${encodeURIComponent(nftId)}/related`, { signal })
  return parseResponse(nftRelatedResponseSchema, data)
}
