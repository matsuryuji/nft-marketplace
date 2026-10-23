import { z } from 'zod'
import { decimalString } from '@/shared/contracts/common'
import {
  nftAvailability,
  nftCategories,
  nftNetworks,
  nftSorts,
  nftTabs,
  type NftCategory,
  type NftListParams,
  type NftNetwork,
  type NftSort,
  type NftTab,
} from '@/shared/contracts/nft'

export const CATALOG_PAGE_SIZE = 9

export const catalogSearchDefaults = {
  tab: 'all',
  sort: 'recent',
  page: 1,
} as const

const toArray = (value: unknown) => (value === undefined ? undefined : Array.isArray(value) ? value : [value])

export const catalogSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  tab: z.enum(nftTabs).default(catalogSearchDefaults.tab).catch(catalogSearchDefaults.tab),
  category: z.preprocess(toArray, z.array(z.enum(nftCategories)).optional()).catch(undefined),
  network: z.preprocess(toArray, z.array(z.enum(nftNetworks)).optional()).catch(undefined),
  availability: z.enum(nftAvailability).optional().catch(undefined),
  minPrice: decimalString.optional().catch(undefined),
  maxPrice: decimalString.optional().catch(undefined),
  sort: z.enum(nftSorts).default(catalogSearchDefaults.sort).catch(catalogSearchDefaults.sort),
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(catalogSearchDefaults.page)
    .catch(catalogSearchDefaults.page),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

const sorted = <T extends string>(values?: T[]) => (values?.length ? [...new Set(values)].sort() : undefined)

export function toNftListParams(search: CatalogSearch): NftListParams {
  return {
    q: search.q || undefined,
    tab: search.tab === 'all' ? undefined : search.tab,
    category: sorted(search.category),
    network: sorted(search.network),
    availability: search.availability,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    sort: search.sort,
    page: search.page,
    pageSize: CATALOG_PAGE_SIZE,
  }
}

export function activeFilterCount(search: CatalogSearch) {
  return (
    (search.category?.length ?? 0) +
    (search.network?.length ?? 0) +
    (search.availability ? 1 : 0) +
    (search.minPrice || search.maxPrice ? 1 : 0)
  )
}

export function hasActiveFilters(search: CatalogSearch) {
  return Boolean(search.q) || activeFilterCount(search) > 0
}

export const categoryLabels: Record<NftCategory, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  subscriptions: 'Assinaturas',
  utility: 'Utilidade',
}

export const networkLabels: Record<NftNetwork, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const tabLabels: Record<NftTab, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}

export const sortLabels: Record<NftSort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  popular: 'Mais curtidos',
}
