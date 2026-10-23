import Decimal from 'decimal.js'
import { http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import {
  nftCategories,
  nftListParamsSchema,
  nftNetworks,
  type NftFacets,
  type NftListParams,
} from '@/shared/contracts/nft'
import { db } from '../db'
import {
  FIXTURE_NOW,
  NEW_RELEASE_WINDOW_DAYS,
  TRENDING_MIN_LIKES,
  type NftRecord,
} from '../fixtures/nfts'
import { errorResponse, simulateNetwork } from '../lib/http'
import { scenarioStore } from '../scenarios'
import { createReviews, ratingSummary } from '../fixtures/reviews'
import { floorPrice, toNftDetail, toNftSummary, totalAvailable } from '../serializers'

const DEFAULT_PAGE_SIZE = 9
const RELATED_LIMIT = 10
const NEW_RELEASE_SINCE = new Date(FIXTURE_NOW - NEW_RELEASE_WINDOW_DAYS * 86_400_000).toISOString()

type Facet = 'category' | 'network' | 'price'

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function parseListParams(url: URL) {
  const params = url.searchParams
  const list = (key: string) => (params.getAll(key).length ? params.getAll(key) : undefined)
  const number = (key: string) => (params.has(key) ? Number(params.get(key)) : undefined)
  return nftListParamsSchema.safeParse({
    q: params.get('q') ?? undefined,
    tab: params.get('tab') ?? undefined,
    category: list('category'),
    network: list('network'),
    availability: params.get('availability') ?? undefined,
    minPrice: params.get('minPrice') ?? undefined,
    maxPrice: params.get('maxPrice') ?? undefined,
    sort: params.get('sort') ?? undefined,
    page: number('page'),
    pageSize: number('pageSize'),
  })
}

function matches(record: NftRecord, params: NftListParams, creatorName: string, ignore?: Facet) {
  if (params.q) {
    const haystack = normalize(`${record.name} ${record.collection} ${creatorName}`)
    if (!haystack.includes(normalize(params.q))) return false
  }
  if (params.tab === 'new' && record.createdAt < NEW_RELEASE_SINCE) return false
  if (params.tab === 'trending' && record.likes < TRENDING_MIN_LIKES) return false
  if (ignore !== 'category' && params.category && !params.category.includes(record.category)) return false
  if (ignore !== 'network' && params.network && !params.network.includes(record.network)) return false
  const available = totalAvailable(record)
  if (params.availability === 'available' && available === 0) return false
  if (params.availability === 'sold-out' && available > 0) return false
  if (ignore !== 'price') {
    const price = new Decimal(floorPrice(record))
    if (params.minPrice && price.lessThan(params.minPrice)) return false
    if (params.maxPrice && price.greaterThan(params.maxPrice)) return false
  }
  return true
}

function compare(sort: NftListParams['sort']) {
  return (a: NftRecord, b: NftRecord) => {
    switch (sort) {
      case 'price-asc':
        return new Decimal(floorPrice(a)).comparedTo(floorPrice(b)) || a.id.localeCompare(b.id)
      case 'price-desc':
        return new Decimal(floorPrice(b)).comparedTo(floorPrice(a)) || a.id.localeCompare(b.id)
      case 'popular':
        return b.likes - a.likes || a.id.localeCompare(b.id)
      default:
        return b.createdAt.localeCompare(a.createdAt)
    }
  }
}

function buildFacets(nfts: NftRecord[], params: NftListParams, creatorName: (id: string) => string): NftFacets {
  const category = Object.fromEntries(nftCategories.map((item) => [item, 0])) as NftFacets['category']
  const network = Object.fromEntries(nftNetworks.map((item) => [item, 0])) as NftFacets['network']
  for (const nft of nfts) {
    const name = creatorName(nft.creatorId)
    if (matches(nft, params, name, 'category')) category[nft.category] += 1
    if (matches(nft, params, name, 'network')) network[nft.network] += 1
  }
  const prices = nfts.map((nft) => new Decimal(floorPrice(nft)))
  return {
    category,
    network,
    priceRange: {
      min: prices.length ? Decimal.min(...prices).toFixed() : '0',
      max: prices.length ? Decimal.max(...prices).toFixed() : '0',
    },
  }
}

export const nftHandlers = [
  http.get(`${env.apiUrl}/nfts`, async ({ request }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (scenarioStore.current === 'server-error') {
      return errorResponse(500, 'INTERNAL_ERROR', 'Falha ao carregar o catálogo.')
    }

    const parsed = parseListParams(new URL(request.url))
    if (!parsed.success) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Parâmetros de busca inválidos.')
    }

    const params = parsed.data
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
    const { state } = db
    const creatorNames = new Map(state.creators.map((creator) => [creator.id, creator.name]))
    const creatorName = (id: string) => creatorNames.get(id) ?? ''
    const source = scenarioStore.current === 'empty' ? [] : state.nfts

    const filtered = source
      .filter((nft) => matches(nft, params, creatorName(nft.creatorId)))
      .sort(compare(params.sort))

    const start = (page - 1) * pageSize
    return HttpResponse.json({
      items: filtered.slice(start, start + pageSize).map((nft) => toNftSummary(nft, state)),
      page,
      pageSize,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
      facets: buildFacets(source, params, creatorName),
    })
  }),

  http.get(`${env.apiUrl}/nfts/:nftId`, async ({ request, params }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (scenarioStore.current === 'server-error') {
      return errorResponse(500, 'INTERNAL_ERROR', 'Falha ao carregar o NFT.')
    }
    const { state } = db
    const record = state.nfts.find((nft) => nft.id === params.nftId)
    if (!record) return errorResponse(404, 'NOT_FOUND', 'NFT não encontrado.')
    return HttpResponse.json(toNftDetail(record, state))
  }),

  http.get(`${env.apiUrl}/nfts/:nftId/reviews`, async ({ request, params }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (scenarioStore.current === 'server-error') {
      return errorResponse(500, 'INTERNAL_ERROR', 'Falha ao carregar as avaliações.')
    }
    const record = db.state.nfts.find((nft) => nft.id === params.nftId)
    if (!record) return errorResponse(404, 'NOT_FOUND', 'NFT não encontrado.')
    return HttpResponse.json({ ...ratingSummary(record), items: createReviews(record) })
  }),

  http.get(`${env.apiUrl}/nfts/:nftId/related`, async ({ request, params }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (scenarioStore.current === 'server-error') {
      return errorResponse(500, 'INTERNAL_ERROR', 'Falha ao carregar a coleção.')
    }
    const { state } = db
    const record = state.nfts.find((nft) => nft.id === params.nftId)
    if (!record) return errorResponse(404, 'NOT_FOUND', 'NFT não encontrado.')
    const items = state.nfts
      .filter((nft) => nft.collection === record.collection && nft.id !== record.id)
      .sort(compare('recent'))
      .slice(0, RELATED_LIMIT)
      .map((nft) => toNftSummary(nft, state))
    return HttpResponse.json({ collection: record.collection, items })
  }),
]
