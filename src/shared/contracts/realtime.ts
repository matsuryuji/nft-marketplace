import { z } from 'zod'
import { orderSchema } from './checkout'
import { decimalString } from './common'

export const REALTIME_EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
} as const

const envelope = <TType extends string, TResource extends string, TData extends z.ZodType>(
  type: TType,
  resource: TResource,
  data: TData,
) =>
  z.object({
    eventId: z.string(),
    type: z.literal(type),
    resource: z.object({ type: z.literal(resource), id: z.string() }),
    version: z.number().int().nonnegative(),
    occurredAt: z.string(),
    data,
  })

export const nftUpdatedEventSchema = envelope(
  REALTIME_EVENTS.nftUpdated,
  'nft',
  z.object({
    nftId: z.string(),
    name: z.string(),
    floorPrice: decimalString,
    available: z.number().int().nonnegative(),
    editions: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        price: decimalString,
        available: z.number().int().nonnegative(),
      }),
    ),
  }),
)

export const orderUpdatedEventSchema = envelope(REALTIME_EVENTS.orderUpdated, 'order', z.object({ order: orderSchema }))

export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>
export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent
