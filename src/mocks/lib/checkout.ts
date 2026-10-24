import type { Order, Quote } from '@/shared/contracts/checkout'
import { db, type CartRecord, type OrderRecord, type QuoteRecord } from '../db'
import { findEdition, serializeCart, touch } from './cart'
import { hashString } from './random'
import { publishNftUpdated, publishOrderUpdated } from '../realtime/hub'
import { randomToken } from './crypto'

export const QUOTE_TTL_MS = 10 * 60_000

const explorerBaseUrl = {
  ethereum: 'https://sepolia.etherscan.io/tx/',
  polygon: 'https://amoy.polygonscan.com/tx/',
} as const
export const ORDER_SETTLE_MS = 4_000

export function buildQuote(cart: CartRecord, userId: string): QuoteRecord {
  const serialized = serializeCart(cart)
  const items = serialized.items.map((item) => ({
    nftId: item.nft.id,
    name: item.nft.name,
    tokenId: item.nft.tokenId,
    image: item.nft.image,
    editionId: item.edition.id,
    editionLabel: item.edition.label,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  }))
  const issues = serialized.items.flatMap((item) =>
    item.issues.filter((issue) => issue !== 'price_changed').map((issue) => `${item.nft.name}: ${issue}`),
  )
  const fingerprint = hashString(
    JSON.stringify({
      items: items.map((item) => [item.editionId, item.quantity, item.unitPrice]),
      coupon: serialized.coupon?.code ?? null,
      summary: serialized.summary,
      issues,
    }),
  ).toString(36)
  const now = Date.now()
  return {
    id: `quote-${randomToken(8)}`,
    userId,
    cartId: cart.id,
    fingerprint,
    items,
    coupon: serialized.coupon,
    summary: serialized.summary,
    canCheckout: serialized.canCheckout,
    issues,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
  }
}

export function toQuote(record: QuoteRecord): Quote {
  return {
    id: record.id,
    fingerprint: record.fingerprint,
    items: record.items,
    coupon: record.coupon,
    summary: record.summary,
    canCheckout: record.canCheckout,
    issues: record.issues,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  }
}

export function payloadHash(value: unknown) {
  return hashString(JSON.stringify(value)).toString(36)
}

function removePurchasedFromCart(order: OrderRecord) {
  const cart = db.state.carts.find((item) => item.userId === order.userId)
  if (!cart) return
  for (const line of order.items) {
    const entry = cart.items.find((item) => item.editionId === line.editionId)
    if (!entry) continue
    entry.quantity -= line.quantity
  }
  cart.items = cart.items.filter((item) => item.quantity > 0)
  if (cart.items.length === 0) cart.couponCode = null
  touch(cart)
}

export function settleOrder(order: OrderRecord) {
  if (order.status !== 'pending' || Date.now() < new Date(order.settlesAt).getTime()) return order

  if (order.plannedOutcome === 'refused') {
    order.status = 'refused'
    order.failureReason = 'O pagamento foi recusado pela carteira. Nenhum valor foi cobrado e seus itens continuam no carrinho.'
  } else {
    const shortage = order.items.find((line) => {
      const found = findEdition(line.nftId, line.editionId)
      return !found || found.edition.available < line.quantity
    })
    if (shortage) {
      order.status = 'refused'
      order.failureReason = `A edição ${shortage.editionLabel} de ${shortage.name} esgotou antes da confirmação. Nenhum valor foi cobrado.`
    } else {
      for (const line of order.items) {
        const found = findEdition(line.nftId, line.editionId)!
        found.edition.available -= line.quantity
        found.nft.version += 1
        publishNftUpdated(found.nft)
      }
      removePurchasedFromCart(order)
      order.status = 'confirmed'
      order.transactionHash = `0x${randomToken(32)}`
    }
  }
  order.settledAt = new Date().toISOString()
  order.version += 1
  db.persist()
  publishOrderUpdated(order)
  return order
}

export function toOrder(record: OrderRecord): Order {
  return {
    id: record.id,
    status: record.status,
    version: record.version,
    items: record.items,
    coupon: record.coupon,
    summary: record.summary,
    buyer: record.buyer,
    wallet: record.wallet,
    transactionHash: record.transactionHash,
    explorerUrl: record.transactionHash ? `${explorerBaseUrl[record.wallet.network]}${record.transactionHash}` : null,
    failureReason: record.failureReason,
    createdAt: record.createdAt,
    settledAt: record.settledAt,
  }
}
