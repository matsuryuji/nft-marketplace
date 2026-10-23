import Decimal from 'decimal.js'
import { http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import { addCartItemRequestSchema, applyCouponRequestSchema, updateCartItemRequestSchema } from '@/shared/contracts/cart'
import type { CartRecord } from '../db'
import {
  couponProblem,
  findCoupon,
  findEdition,
  maxQuantityFor,
  resolveCart,
  serializeCart,
  subtotalOf,
  touch,
} from '../lib/cart'
import { randomToken } from '../lib/crypto'
import { errorResponse, simulateNetwork } from '../lib/http'
import { scenarioStore } from '../scenarios'

function cartResponse(cart: CartRecord | null, setCookie: string | null, status = 200) {
  return HttpResponse.json(serializeCart(cart), {
    status,
    headers: setCookie ? { 'Set-Cookie': setCookie } : undefined,
  })
}

const unavailableService = () =>
  errorResponse(503, 'SERVICE_UNAVAILABLE', 'Carrinho indisponível no momento. Tente novamente.')

const limitMessage = (limit: number) =>
  limit === 0 ? 'Esta edição está esgotada.' : `Quantidade indisponível. Máximo de ${limit} para esta edição.`

export const cartHandlers = [
  http.get(`${env.apiUrl}/cart`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (scenarioStore.current === 'server-error') return unavailableService()
    const { cart } = resolveCart(cookies, { create: false })
    return cartResponse(cart, null)
  }),

  http.post(`${env.apiUrl}/cart/items`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (scenarioStore.current === 'server-error') return unavailableService()

    const parsed = addCartItemRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return errorResponse(422, 'VALIDATION_ERROR', 'Item inválido.')
    const found = findEdition(parsed.data.nftId, parsed.data.editionId)
    if (!found) return errorResponse(404, 'NOT_FOUND', 'NFT ou edição não encontrado.')

    const { cart, setCookie } = resolveCart(cookies, { create: true })
    if (!cart) return unavailableService()
    const limit = maxQuantityFor(found.edition)
    const existing = cart.items.find((item) => item.editionId === parsed.data.editionId)
    const nextQuantity = (existing?.quantity ?? 0) + parsed.data.quantity
    if (nextQuantity > limit) return errorResponse(409, 'AVAILABILITY_CONFLICT', limitMessage(limit))

    if (existing) {
      existing.quantity = nextQuantity
      existing.baselinePrice = found.edition.price
    } else {
      cart.items.push({
        id: `item-${randomToken(6)}`,
        nftId: found.nft.id,
        editionId: found.edition.id,
        quantity: nextQuantity,
        baselinePrice: found.edition.price,
        addedAt: new Date().toISOString(),
      })
    }
    touch(cart)
    return cartResponse(cart, setCookie, 201)
  }),

  http.patch(`${env.apiUrl}/cart/items/:itemId`, async ({ request, params, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (scenarioStore.current === 'server-error') return unavailableService()

    const parsed = updateCartItemRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return errorResponse(422, 'VALIDATION_ERROR', 'A quantidade precisa ser um número inteiro maior que zero.')
    const { cart } = resolveCart(cookies, { create: false })
    const item = cart?.items.find((entry) => entry.id === params.itemId)
    if (!cart || !item) return errorResponse(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
    const found = findEdition(item.nftId, item.editionId)
    const limit = found ? maxQuantityFor(found.edition) : 0
    if (parsed.data.quantity > limit) return errorResponse(409, 'AVAILABILITY_CONFLICT', limitMessage(limit))

    item.quantity = parsed.data.quantity
    if (found) item.baselinePrice = found.edition.price
    touch(cart)
    return cartResponse(cart, null)
  }),

  http.delete(`${env.apiUrl}/cart/items/:itemId`, async ({ request, params, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (scenarioStore.current === 'server-error') return unavailableService()

    const { cart } = resolveCart(cookies, { create: false })
    if (!cart || !cart.items.some((item) => item.id === params.itemId)) {
      return errorResponse(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
    }
    cart.items = cart.items.filter((item) => item.id !== params.itemId)
    touch(cart)
    return cartResponse(cart, null)
  }),

  http.post(`${env.apiUrl}/cart/acknowledge-prices`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const { cart } = resolveCart(cookies, { create: false })
    if (!cart) return cartResponse(null, null)
    for (const item of cart.items) {
      const found = findEdition(item.nftId, item.editionId)
      if (found) item.baselinePrice = found.edition.price
    }
    touch(cart)
    return cartResponse(cart, null)
  }),

  http.put(`${env.apiUrl}/cart/coupon`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (scenarioStore.current === 'server-error') return unavailableService()

    const parsed = applyCouponRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Informe um código promocional.', { code: 'Informe um código promocional' })
    }
    const { cart } = resolveCart(cookies, { create: false })
    if (!cart || cart.items.length === 0) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Adicione itens ao carrinho antes de aplicar um cupom.')
    }
    const coupon = findCoupon(parsed.data.code)
    const problem = couponProblem(coupon, new Decimal(subtotalOf(cart)))
    if (problem) return errorResponse(422, problem.code, problem.message, { code: problem.message })

    cart.couponCode = coupon!.code
    touch(cart)
    return cartResponse(cart, null)
  }),

  http.delete(`${env.apiUrl}/cart/coupon`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const { cart } = resolveCart(cookies, { create: false })
    if (cart) {
      cart.couponCode = null
      touch(cart)
    }
    return cartResponse(cart, null)
  }),
]
