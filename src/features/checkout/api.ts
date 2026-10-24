import { http, parseResponse } from '@/shared/api/client'
import { orderSchema, quoteSchema, type CreateOrderRequest } from '@/shared/contracts/checkout'

export async function createQuote() {
  const { data } = await http.post('/checkout/quote')
  return parseResponse(quoteSchema, data)
}

export async function createOrder(body: CreateOrderRequest, idempotencyKey: string) {
  const { data } = await http.post('/orders', body, { headers: { 'Idempotency-Key': idempotencyKey } })
  return parseResponse(orderSchema, data)
}

export async function fetchOrder(orderId: string, signal?: AbortSignal) {
  const { data } = await http.get(`/orders/${encodeURIComponent(orderId)}`, { signal })
  return parseResponse(orderSchema, data)
}
