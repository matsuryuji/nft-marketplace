import { z } from 'zod'
import { nftCategories, nftImageSchema, nftSummarySchema, nftTabs } from './nft'

export const catalogLinkSchema = z.object({
  tab: z.enum(nftTabs).optional(),
  category: z.array(z.enum(nftCategories)).optional(),
})

export const heroSlideSchema = z.object({
  id: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  description: z.string(),
  ctaLabel: z.string(),
  nftId: z.string(),
  image: nftImageSchema,
  secondaryImage: nftImageSchema.nullable(),
})

export const promotionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  ctaLabel: z.string(),
  image: nftImageSchema,
  catalogLink: catalogLinkSchema,
})

export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  image: nftImageSchema,
  publishedAt: z.string(),
  readingMinutes: z.number().int().positive(),
})

export const homeContentSchema = z.object({
  heroSlides: z.array(heroSlideSchema),
  spotlight: z.object({ label: z.string(), nft: nftSummarySchema }).nullable(),
  promotions: z.array(promotionSchema),
  articles: z.array(articleSchema),
})

export const newsletterRequestSchema = z.object({
  email: z.email('Informe um e-mail válido'),
})

export const newsletterResponseSchema = z.object({
  email: z.string(),
  subscribedAt: z.string(),
})

export type HeroSlide = z.infer<typeof heroSlideSchema>
export type Promotion = z.infer<typeof promotionSchema>
export type Article = z.infer<typeof articleSchema>
export type HomeContent = z.infer<typeof homeContentSchema>
export type CatalogLink = z.infer<typeof catalogLinkSchema>
export type NewsletterRequest = z.infer<typeof newsletterRequestSchema>
