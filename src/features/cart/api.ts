import { http, parseResponse } from '@/shared/api/client'
import { cartSchema, type AddCartItemRequest } from '@/shared/contracts/cart'

const parseCart = (data: unknown) => parseResponse(cartSchema, data)

export async function fetchCart(signal?: AbortSignal) {
  const { data } = await http.get('/cart', { signal })
  return parseCart(data)
}

export async function addCartItem(body: AddCartItemRequest) {
  const { data } = await http.post('/cart/items', body)
  return parseCart(data)
}

export async function updateCartItem(itemId: string, quantity: number) {
  const { data } = await http.patch(`/cart/items/${encodeURIComponent(itemId)}`, { quantity })
  return parseCart(data)
}

export async function removeCartItem(itemId: string) {
  const { data } = await http.delete(`/cart/items/${encodeURIComponent(itemId)}`)
  return parseCart(data)
}

export async function applyCoupon(code: string) {
  const { data } = await http.put('/cart/coupon', { code })
  return parseCart(data)
}

export async function removeCoupon() {
  const { data } = await http.delete('/cart/coupon')
  return parseCart(data)
}

export async function acknowledgePrices() {
  const { data } = await http.post('/cart/acknowledge-prices')
  return parseCart(data)
}
