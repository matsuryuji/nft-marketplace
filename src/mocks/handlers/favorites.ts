import { http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import type { FavoritesResponse } from '@/shared/contracts/favorites'
import { db } from '../db'
import { errorResponse, simulateNetwork } from '../lib/http'
import { requireSession } from '../lib/session'
import { scenarioStore } from '../scenarios'
import { toNftSummary } from '../serializers'

function favoritesOf(userId: string): FavoritesResponse {
  const { state } = db
  const entries = state.favorites
    .filter((favorite) => favorite.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const items = entries.flatMap((entry) => {
    const nft = state.nfts.find((item) => item.id === entry.nftId)
    return nft ? [toNftSummary(nft, state)] : []
  })
  return { ids: items.map((item) => item.id), items }
}

const failing = () =>
  scenarioStore.current === 'favorites-error' || scenarioStore.current === 'server-error'
    ? errorResponse(503, 'SERVICE_UNAVAILABLE', 'Não foi possível atualizar seus favoritos. Tente novamente.')
    : null

export const favoriteHandlers = [
  http.get(`${env.apiUrl}/favorites`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    return HttpResponse.json(favoritesOf(auth.user.id))
  }),

  http.put(`${env.apiUrl}/favorites/:nftId`, async ({ request, params, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    const failure = failing()
    if (failure) return failure
    const nftId = String(params.nftId)
    if (!db.state.nfts.some((nft) => nft.id === nftId)) return errorResponse(404, 'NOT_FOUND', 'NFT não encontrado.')
    if (!db.state.favorites.some((item) => item.userId === auth.user.id && item.nftId === nftId)) {
      db.state.favorites.push({ userId: auth.user.id, nftId, createdAt: new Date().toISOString() })
      db.persist()
    }
    return HttpResponse.json(favoritesOf(auth.user.id))
  }),

  http.delete(`${env.apiUrl}/favorites/:nftId`, async ({ request, params, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    const failure = failing()
    if (failure) return failure
    db.state.favorites = db.state.favorites.filter((item) => !(item.userId === auth.user.id && item.nftId === params.nftId))
    db.persist()
    return HttpResponse.json(favoritesOf(auth.user.id))
  }),
]
