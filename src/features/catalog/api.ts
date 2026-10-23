import { http, parseResponse } from '@/shared/api/client'
import {
  nftDetailSchema,
  nftListResponseSchema,
  type NftListParams,
} from '@/shared/contracts/nft'

export async function fetchNfts(params: NftListParams, signal?: AbortSignal) {
  const { data } = await http.get('/nfts', { params, signal })
  return parseResponse(nftListResponseSchema, data)
}

export async function fetchNft(nftId: string, signal?: AbortSignal) {
  const { data } = await http.get(`/nfts/${encodeURIComponent(nftId)}`, { signal })
  return parseResponse(nftDetailSchema, data)
}
