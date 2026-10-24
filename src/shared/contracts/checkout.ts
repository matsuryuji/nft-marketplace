import { z } from 'zod'
import { cartCouponSchema, cartSummarySchema } from './cart'
import { decimalString } from './common'
import { nftImageSchema } from './nft'
import { walletNetworks, walletProviders } from './wallet'

export const orderStatuses = ['pending', 'confirmed', 'refused'] as const

export const orderLineSchema = z.object({
  nftId: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: nftImageSchema,
  editionId: z.string(),
  editionLabel: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: decimalString,
  lineTotal: decimalString,
})

export const quoteSchema = z.object({
  id: z.string(),
  fingerprint: z.string(),
  items: z.array(orderLineSchema),
  coupon: cartCouponSchema.nullable(),
  summary: cartSummarySchema,
  canCheckout: z.boolean(),
  issues: z.array(z.string()),
  createdAt: z.string(),
  expiresAt: z.string(),
})

export const buyerSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome de exibição').max(48, 'Use no máximo 48 caracteres'),
  username: z
    .string()
    .trim()
    .min(3, 'Use pelo menos 3 caracteres')
    .max(20, 'Use no máximo 20 caracteres')
    .regex(/^[a-z0-9_.]+$/, 'Use apenas letras minúsculas, números, ponto ou _'),
  email: z.string().trim().min(1, 'Informe seu e-mail').email('Informe um e-mail válido'),
  referralCode: z
    .string()
    .trim()
    .max(16, 'Use no máximo 16 caracteres')
    .refine((value) => value === '' || /^[A-Za-z0-9-]+$/.test(value), 'Use letras, números e hífen'),
  note: z.string().trim().max(280, 'Use no máximo 280 caracteres'),
})

export const createOrderRequestSchema = z.object({
  quoteId: z.string(),
  walletId: z.string(),
  provider: z.enum(walletProviders),
  buyer: buyerSchema,
})

export const orderSchema = z.object({
  id: z.string(),
  status: z.enum(orderStatuses),
  version: z.number().int().nonnegative(),
  items: z.array(orderLineSchema),
  coupon: cartCouponSchema.nullable(),
  summary: cartSummarySchema,
  buyer: buyerSchema,
  wallet: z.object({
    label: z.string(),
    address: z.string(),
    network: z.enum(walletNetworks),
    provider: z.enum(walletProviders),
  }),
  transactionHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  failureReason: z.string().nullable(),
  createdAt: z.string(),
  settledAt: z.string().nullable(),
})

export type OrderLine = z.infer<typeof orderLineSchema>
export type Quote = z.infer<typeof quoteSchema>
export type Buyer = z.infer<typeof buyerSchema>
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>
export type Order = z.infer<typeof orderSchema>
export type OrderStatus = (typeof orderStatuses)[number]
