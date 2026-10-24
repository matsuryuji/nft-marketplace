import { z } from 'zod'
import { decimalString } from './common'
import { nftImageSchema } from './nft'
import { walletNetworks } from './wallet'

export const collectionItemSchema = z.object({
  nftId: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: nftImageSchema,
  editionId: z.string(),
  editionLabel: z.string(),
  quantity: z.number().int().positive(),
  totalPaid: decimalString,
  network: z.enum(walletNetworks),
  lastOrderId: z.string(),
  lastAcquiredAt: z.string(),
})

export const collectionResponseSchema = z.object({
  items: z.array(collectionItemSchema),
  totalQuantity: z.number().int().nonnegative(),
  pendingOrders: z.number().int().nonnegative(),
})

export type CollectionItem = z.infer<typeof collectionItemSchema>
export type CollectionResponse = z.infer<typeof collectionResponseSchema>
