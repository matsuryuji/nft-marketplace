import { z } from 'zod'
import { decimalString } from './common'
import { nftImageSchema } from './nft'

export const cartItemIssues = ['price_changed', 'insufficient_availability', 'unavailable'] as const

export const cartItemSchema = z.object({
  id: z.string(),
  nft: z.object({
    id: z.string(),
    name: z.string(),
    tokenId: z.string(),
    image: nftImageSchema,
  }),
  edition: z.object({
    id: z.string(),
    label: z.string(),
    available: z.number().int().nonnegative(),
    maxPerOrder: z.number().int().positive(),
  }),
  quantity: z.number().int().positive(),
  maxQuantity: z.number().int().nonnegative(),
  unitPrice: decimalString,
  previousUnitPrice: decimalString.nullable(),
  lineTotal: decimalString,
  issues: z.array(z.enum(cartItemIssues)),
})

export const cartCouponSchema = z.object({
  code: z.string(),
  description: z.string(),
})

export const cartSummarySchema = z.object({
  subtotal: decimalString,
  discount: decimalString,
  networkFee: decimalString,
  total: decimalString,
})

export const cartSchema = z.object({
  id: z.string(),
  version: z.number().int().nonnegative(),
  items: z.array(cartItemSchema),
  itemCount: z.number().int().nonnegative(),
  coupon: cartCouponSchema.nullable(),
  summary: cartSummarySchema,
  canCheckout: z.boolean(),
  updatedAt: z.string(),
})

export const addCartItemRequestSchema = z.object({
  nftId: z.string(),
  editionId: z.string(),
  quantity: z.number().int().positive(),
})

export const updateCartItemRequestSchema = z.object({
  quantity: z.number().int().positive(),
})

export const applyCouponRequestSchema = z.object({
  code: z.string().trim().min(1, 'Informe um código promocional').max(32),
})

export type CartItemIssue = (typeof cartItemIssues)[number]
export type CartItem = z.infer<typeof cartItemSchema>
export type CartSummary = z.infer<typeof cartSummarySchema>
export type Cart = z.infer<typeof cartSchema>
export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>
