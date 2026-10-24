import { http, parseResponse } from '@/shared/api/client'
import { favoritesResponseSchema } from '@/shared/contracts/favorites'

export async function fetchFavorites(signal?: AbortSignal) {
  const { data } = await http.get('/favorites', { signal })
  return parseResponse(favoritesResponseSchema, data)
}

export async function addFavorite(nftId: string) {
  const { data } = await http.put(`/favorites/${encodeURIComponent(nftId)}`)
  return parseResponse(favoritesResponseSchema, data)
}

export async function removeFavorite(nftId: string) {
  const { data } = await http.delete(`/favorites/${encodeURIComponent(nftId)}`)
  return parseResponse(favoritesResponseSchema, data)
}
