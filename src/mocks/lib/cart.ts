import Decimal from 'decimal.js'
import type { Cart, CartItem, CartItemIssue } from '@/shared/contracts/cart'
import { db, type CartRecord } from '../db'
import { CART_COOKIE, couponFixtures, NETWORK_FEE, type CouponRecord } from '../fixtures/coupons'
import { SESSION_COOKIE } from '../fixtures/users'
import { artworkImage } from '../serializers'
import { randomToken } from './crypto'

export const cartCookie = (cartId: string) => `${CART_COOKIE}=${cartId}; Path=/; Max-Age=2592000; SameSite=Lax`
export const clearedCartCookie = `${CART_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`

export function sessionUserId(cookies: Record<string, string>) {
  const token = cookies[SESSION_COOKIE]
  if (!token) return null
  const session = db.state.sessions.find((item) => item.token === token)
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null
  return session.userId
}

function createCart(userId: string | null): CartRecord {
  const cart = {
    id: `cart-${randomToken(8)}`,
    userId,
    items: [],
    couponCode: null,
    version: 0,
    updatedAt: new Date().toISOString(),
  }
  db.state.carts.push(cart)
  return cart
}

export function resolveCart(cookies: Record<string, string>, options: { create: boolean }) {
  const userId = sessionUserId(cookies)
  const { carts } = db.state
  if (userId) {
    const cart = carts.find((item) => item.userId === userId) ?? (options.create ? createCart(userId) : null)
    return { cart, setCookie: null }
  }
  const guestId = cookies[CART_COOKIE]
  const existing = guestId ? carts.find((item) => item.id === guestId && item.userId === null) : undefined
  if (existing) return { cart: existing, setCookie: null }
  if (!options.create) return { cart: null, setCookie: null }
  const cart = createCart(null)
  return { cart, setCookie: cartCookie(cart.id) }
}

export function touch(cart: CartRecord) {
  cart.version += 1
  cart.updatedAt = new Date().toISOString()
  db.persist()
}

export function findEdition(nftId: string, editionId: string) {
  const nft = db.state.nfts.find((item) => item.id === nftId)
  const edition = nft?.editions.find((item) => item.id === editionId)
  return nft && edition ? { nft, edition } : null
}

export const maxQuantityFor = (edition: { available: number; maxPerOrder: number }) =>
  Math.min(edition.available, edition.maxPerOrder)

export function findCoupon(code: string) {
  return couponFixtures.find((coupon) => coupon.code === code.trim().toUpperCase()) ?? null
}

export function couponProblem(coupon: CouponRecord | null, subtotal: Decimal) {
  if (!coupon) return { code: 'COUPON_INVALID' as const, message: 'Código promocional inválido.' }
  if (new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { code: 'COUPON_EXPIRED' as const, message: 'Este código promocional expirou.' }
  }
  if (subtotal.lessThan(coupon.minSubtotal)) {
    return {
      code: 'COUPON_INVALID' as const,
      message: `Este código exige um subtotal mínimo de ${coupon.minSubtotal} ETH.`,
    }
  }
  return null
}

function discountFor(coupon: CouponRecord, subtotal: Decimal) {
  const raw = coupon.type === 'percent' ? subtotal.times(coupon.value).dividedBy(100) : new Decimal(coupon.value)
  return Decimal.min(raw, subtotal).toDecimalPlaces(6, Decimal.ROUND_DOWN)
}

export function subtotalOf(cart: CartRecord) {
  return cart.items.reduce((sum, item) => {
    const found = findEdition(item.nftId, item.editionId)
    return found ? sum.plus(new Decimal(found.edition.price).times(item.quantity)) : sum
  }, new Decimal(0))
}

export function serializeCart(cart: CartRecord | null): Cart {
  if (!cart) {
    return {
      id: 'empty',
      version: 0,
      items: [],
      itemCount: 0,
      coupon: null,
      summary: { subtotal: '0', discount: '0', networkFee: '0', total: '0' },
      canCheckout: false,
      updatedAt: new Date(0).toISOString(),
    }
  }

  const items: CartItem[] = cart.items.flatMap((item) => {
    const found = findEdition(item.nftId, item.editionId)
    if (!found) return []
    const { nft, edition } = found
    const maxQuantity = maxQuantityFor(edition)
    const issues: CartItemIssue[] = []
    if (edition.available === 0) issues.push('unavailable')
    else if (item.quantity > maxQuantity) issues.push('insufficient_availability')
    if (!new Decimal(edition.price).equals(item.baselinePrice)) issues.push('price_changed')
    return [
      {
        id: item.id,
        nft: {
          id: nft.id,
          name: nft.name,
          tokenId: nft.tokenId,
          image: artworkImage(nft.imageIndexes[0], `Arte do NFT ${nft.name}`),
        },
        edition: {
          id: edition.id,
          label: edition.label,
          available: edition.available,
          maxPerOrder: edition.maxPerOrder,
        },
        quantity: item.quantity,
        maxQuantity,
        unitPrice: edition.price,
        previousUnitPrice: issues.includes('price_changed') ? item.baselinePrice : null,
        lineTotal: new Decimal(edition.price).times(item.quantity).toFixed(),
        issues,
      },
    ]
  })

  const subtotal = subtotalOf(cart)
  const coupon = cart.couponCode ? findCoupon(cart.couponCode) : null
  const validCoupon = coupon && !couponProblem(coupon, subtotal) ? coupon : null
  const discount = validCoupon ? discountFor(validCoupon, subtotal) : new Decimal(0)
  const networkFee = items.length > 0 ? new Decimal(NETWORK_FEE) : new Decimal(0)

  return {
    id: cart.id,
    version: cart.version,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    coupon: validCoupon ? { code: validCoupon.code, description: validCoupon.description } : null,
    summary: {
      subtotal: subtotal.toFixed(),
      discount: discount.toFixed(),
      networkFee: networkFee.toFixed(),
      total: subtotal.minus(discount).plus(networkFee).toFixed(),
    },
    canCheckout: items.length > 0 && items.every((item) => !item.issues.some((issue) => issue !== 'price_changed')),
    updatedAt: cart.updatedAt,
  }
}

export function mergeGuestCart(guestCartId: string | undefined, userId: string) {
  if (!guestCartId) return false
  const { state } = db
  const guest = state.carts.find((item) => item.id === guestCartId && item.userId === null)
  if (!guest) return false
  const target = state.carts.find((item) => item.userId === userId) ?? createCart(userId)

  for (const item of guest.items) {
    const found = findEdition(item.nftId, item.editionId)
    if (!found) continue
    const limit = maxQuantityFor(found.edition)
    const existing = target.items.find((entry) => entry.editionId === item.editionId)
    if (existing) existing.quantity = Math.max(1, Math.min(existing.quantity + item.quantity, limit))
    else target.items.push({ ...item, id: `item-${randomToken(6)}` })
  }
  if (!target.couponCode && guest.couponCode) target.couponCode = guest.couponCode

  state.carts = state.carts.filter((item) => item.id !== guest.id)
  touch(target)
  return true
}
