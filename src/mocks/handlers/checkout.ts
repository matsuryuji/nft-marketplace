import Decimal from 'decimal.js'
import { delay, http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import { createOrderRequestSchema } from '@/shared/contracts/checkout'
import { db } from '../db'
import { findEdition, touch } from '../lib/cart'
import { buildQuote, ORDER_SETTLE_MS, payloadHash, settleOrder, toOrder, toQuote } from '../lib/checkout'
import { randomToken } from '../lib/crypto'
import { errorResponse, simulateNetwork } from '../lib/http'
import { requireSession } from '../lib/session'
import { publishNftUpdated } from '../realtime/hub'
import { scenarioStore } from '../scenarios'

const ORDER_TIMEOUT_DELAY_MS = 12_000

function userCart(userId: string) {
  return db.state.carts.find((cart) => cart.userId === userId) ?? null
}

function applyCheckoutDisruption(userId: string) {
  const scenario = scenarioStore.current
  if (scenario !== 'checkout-price-change' && scenario !== 'checkout-sold-out') return
  const flag = `${scenario}:${userId}`
  if (db.state.scenarioFlags.includes(flag)) return
  const cart = userCart(userId)
  const first = cart?.items[0]
  const found = first ? findEdition(first.nftId, first.editionId) : null
  if (!cart || !found) return

  if (scenario === 'checkout-price-change') {
    found.edition.price = new Decimal(found.edition.price).times(1.1).toDecimalPlaces(4).toFixed()
  } else {
    found.edition.available = 0
  }
  found.nft.version += 1
  db.state.scenarioFlags.push(flag)
  touch(cart)
  publishNftUpdated(found.nft)
}

export const checkoutHandlers = [
  http.post(`${env.apiUrl}/checkout/quote`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    if (scenarioStore.current === 'server-error') {
      return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Não foi possível calcular a cotação. Tente novamente.')
    }
    const cart = userCart(auth.user.id)
    if (!cart || cart.items.length === 0) return errorResponse(422, 'VALIDATION_ERROR', 'Seu carrinho está vazio.')

    const quote = buildQuote(cart, auth.user.id)
    db.state.quotes = [...db.state.quotes.filter((item) => item.userId !== auth.user.id), quote]
    db.persist()
    return HttpResponse.json(toQuote(quote), { status: 201 })
  }),

  http.post(`${env.apiUrl}/orders`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response

    const idempotencyKey = request.headers.get('Idempotency-Key')
    if (!idempotencyKey) return errorResponse(422, 'VALIDATION_ERROR', 'Cabeçalho Idempotency-Key obrigatório.')
    const parsed = createOrderRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return errorResponse(422, 'VALIDATION_ERROR', 'Verifique os dados do pedido.')

    const { state } = db
    const hash = payloadHash(parsed.data)
    const existing = state.orders.find((order) => order.userId === auth.user.id && order.idempotencyKey === idempotencyKey)
    if (existing) {
      if (existing.payloadHash !== hash) {
        return errorResponse(409, 'IDEMPOTENCY_CONFLICT', 'Esta tentativa de compra já foi usada com outros dados.')
      }
      return HttpResponse.json(toOrder(settleOrder(existing)), { status: 200 })
    }

    applyCheckoutDisruption(auth.user.id)

    const quote = state.quotes.find((item) => item.id === parsed.data.quoteId && item.userId === auth.user.id)
    if (!quote || new Date(quote.expiresAt).getTime() < Date.now()) {
      return errorResponse(409, 'QUOTE_OUTDATED', 'A cotação expirou. Revise os valores atualizados.')
    }
    const cart = userCart(auth.user.id)
    if (!cart || cart.items.length === 0) return errorResponse(422, 'VALIDATION_ERROR', 'Seu carrinho está vazio.')
    const current = buildQuote(cart, auth.user.id)
    if (!current.canCheckout) {
      return errorResponse(409, 'AVAILABILITY_CONFLICT', 'Um ou mais itens não estão mais disponíveis na quantidade escolhida.')
    }
    if (current.fingerprint !== quote.fingerprint) {
      return errorResponse(409, 'QUOTE_OUTDATED', 'Os preços, a disponibilidade ou as taxas mudaram. Revise e confirme novamente.')
    }

    const wallet = state.wallets.find((item) => item.id === parsed.data.walletId && item.userId === auth.user.id)
    if (!wallet) return errorResponse(404, 'NOT_FOUND', 'Carteira não encontrada.')
    const session = state.walletSessions.find((item) => item.userId === auth.user.id)
    if (!session || session.walletId !== wallet.id || session.provider !== parsed.data.provider) {
      return errorResponse(409, 'WALLET_REJECTED', 'Conecte a carteira selecionada antes de confirmar a compra.')
    }

    const now = Date.now()
    const order = {
      id: `order-${randomToken(6)}`,
      userId: auth.user.id,
      idempotencyKey,
      payloadHash: hash,
      quoteId: quote.id,
      status: 'pending' as const,
      plannedOutcome: scenarioStore.current === 'payment-refused' ? ('refused' as const) : ('confirmed' as const),
      version: 1,
      items: quote.items,
      coupon: quote.coupon,
      summary: quote.summary,
      buyer: parsed.data.buyer,
      wallet: { label: wallet.label, address: wallet.address, network: wallet.network, provider: parsed.data.provider },
      transactionHash: null,
      failureReason: null,
      createdAt: new Date(now).toISOString(),
      settlesAt: new Date(now + ORDER_SETTLE_MS).toISOString(),
      settledAt: null,
    }
    state.orders.push(order)
    state.quotes = state.quotes.filter((item) => item.id !== quote.id)
    db.persist()
    window.setTimeout(() => {
      const stored = db.state.orders.find((item) => item.id === order.id)
      if (stored) settleOrder(stored)
    }, ORDER_SETTLE_MS)

    if (scenarioStore.current === 'order-timeout') await delay(ORDER_TIMEOUT_DELAY_MS)
    return HttpResponse.json(toOrder(order), { status: 201 })
  }),

  http.get(`${env.apiUrl}/orders/:orderId`, async ({ request, params, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    const order = db.state.orders.find((item) => item.id === params.orderId)
    if (!order) return errorResponse(404, 'NOT_FOUND', 'Pedido não encontrado.')
    if (order.userId !== auth.user.id) return errorResponse(403, 'FORBIDDEN', 'Este pedido pertence a outra conta.')
    return HttpResponse.json(toOrder(settleOrder(order)))
  }),
]
