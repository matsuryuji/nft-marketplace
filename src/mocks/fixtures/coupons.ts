export type CouponRecord = {
  code: string
  description: string
  type: 'percent' | 'fixed'
  value: string
  minSubtotal: string
  expiresAt: string
}

export const NETWORK_FEE = '0.016'
export const CART_COOKIE = 'kurio_cart'

export const couponFixtures: CouponRecord[] = [
  {
    code: 'KURIO10',
    description: '10% de desconto no lançamento',
    type: 'percent',
    value: '10',
    minSubtotal: '0',
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'GENESIS',
    description: '0.05 ETH de desconto em pedidos a partir de 0.5 ETH',
    type: 'fixed',
    value: '0.05',
    minSubtotal: '0.5',
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'BEMVINDO',
    description: '15% de desconto de boas-vindas',
    type: 'percent',
    value: '15',
    minSubtotal: '0',
    expiresAt: '2026-01-31T23:59:59.000Z',
  },
]
