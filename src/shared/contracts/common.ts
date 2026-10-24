import { z } from 'zod'

export const decimalString = z
  .string()
  .regex(/^\d+(\.\d+)?$/, 'Expected a non-negative decimal string')

export const apiErrorCodes = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'AVAILABILITY_CONFLICT',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'QUOTE_OUTDATED',
  'WALLET_REJECTED',
  'IDEMPOTENCY_CONFLICT',
  'RATE_LIMITED',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.enum(apiErrorCodes),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
})

export type ApiErrorCode = (typeof apiErrorCodes)[number]
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
}

export type Paginated<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
