import { z } from 'zod'
import { decimalString, paginatedSchema } from './common'

export const nftCategories = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'subscriptions',
  'utility',
] as const

export const nftNetworks = ['ethereum', 'polygon', 'solana'] as const
export const nftTabs = ['all', 'new', 'trending'] as const
export const nftRarities = ['common', 'rare', 'legendary'] as const
export const nftSorts = ['recent', 'price-asc', 'price-desc', 'popular'] as const
export const nftAvailability = ['available', 'sold-out'] as const

export const nftImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

export const nftCreatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string(),
})

export const nftEditionSchema = z.object({
  id: z.string(),
  label: z.string(),
  price: decimalString,
  supply: z.number().int().positive(),
  available: z.number().int().nonnegative(),
  maxPerOrder: z.number().int().positive(),
})

export const nftSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(nftCategories),
  network: z.enum(nftNetworks),
  rarity: z.enum(nftRarities),
  collection: z.string(),
  creator: nftCreatorSchema,
  image: nftImageSchema,
  floorPrice: decimalString,
  compareAtPrice: decimalString.nullable(),
  available: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative(),
  createdAt: z.string(),
  version: z.number().int().positive(),
})

export const nftRatingSchema = z.object({
  average: z.number().min(0).max(5),
  count: z.number().int().nonnegative(),
})

export const nftDetailSchema = nftSummarySchema.extend({
  description: z.string(),
  story: z.array(z.string()),
  tokenId: z.string(),
  attributes: z.array(z.string()),
  rating: nftRatingSchema,
  images: z.array(nftImageSchema).min(1),
  editions: z.array(nftEditionSchema).min(1),
  provenance: z.string(),
  contractAddress: z.string(),
  tokenStandard: z.string(),
  royaltiesPercent: z.number().min(0).max(100),
})

export const nftReviewSchema = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: z.string(),
})

export const nftReviewsResponseSchema = nftRatingSchema.extend({
  items: z.array(nftReviewSchema),
})

export const nftRelatedResponseSchema = z.object({
  collection: z.string(),
  items: z.array(nftSummarySchema),
})

export const nftListParamsSchema = z.object({
  q: z.string().trim().max(80).optional(),
  tab: z.enum(nftTabs).optional(),
  category: z.array(z.enum(nftCategories)).optional(),
  network: z.array(z.enum(nftNetworks)).optional(),
  availability: z.enum(nftAvailability).optional(),
  minPrice: decimalString.optional(),
  maxPrice: decimalString.optional(),
  sort: z.enum(nftSorts).optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(48).optional(),
})

export const nftFacetsSchema = z.object({
  category: z.record(z.enum(nftCategories), z.number().int().nonnegative()),
  network: z.record(z.enum(nftNetworks), z.number().int().nonnegative()),
  priceRange: z.object({ min: decimalString, max: decimalString }),
})

export const nftListResponseSchema = paginatedSchema(nftSummarySchema).extend({
  facets: nftFacetsSchema,
})

export type NftCategory = (typeof nftCategories)[number]
export type NftNetwork = (typeof nftNetworks)[number]
export type NftTab = (typeof nftTabs)[number]
export type NftRarity = (typeof nftRarities)[number]
export type NftFacets = z.infer<typeof nftFacetsSchema>
export type NftSort = (typeof nftSorts)[number]
export type NftAvailability = (typeof nftAvailability)[number]
export type NftImage = z.infer<typeof nftImageSchema>
export type NftEdition = z.infer<typeof nftEditionSchema>
export type NftSummary = z.infer<typeof nftSummarySchema>
export type NftDetail = z.infer<typeof nftDetailSchema>
export type NftRating = z.infer<typeof nftRatingSchema>
export type NftReview = z.infer<typeof nftReviewSchema>
export type NftReviewsResponse = z.infer<typeof nftReviewsResponseSchema>
export type NftListParams = z.infer<typeof nftListParamsSchema>
export type NftListResponse = z.infer<typeof nftListResponseSchema>
