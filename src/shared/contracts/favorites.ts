import { z } from 'zod'
import { nftSummarySchema } from './nft'

export const favoritesResponseSchema = z.object({
  ids: z.array(z.string()),
  items: z.array(nftSummarySchema),
})

export type FavoritesResponse = z.infer<typeof favoritesResponseSchema>
