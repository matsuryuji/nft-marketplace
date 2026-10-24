import Decimal from 'decimal.js'
import { http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import type { CollectionItem, CollectionResponse } from '@/shared/contracts/collection'
import { db } from '../db'
import { settleOrder } from '../lib/checkout'
import { simulateNetwork } from '../lib/http'
import { requireSession } from '../lib/session'

export const collectionHandlers = [
  http.get(`${env.apiUrl}/collection`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response

    const orders = db.state.orders.filter((order) => order.userId === auth.user.id).map((order) => settleOrder(order))
    const byEdition = new Map<string, CollectionItem>()

    for (const order of orders.filter((item) => item.status === 'confirmed')) {
      const acquiredAt = order.settledAt ?? order.createdAt
      for (const line of order.items) {
        const current = byEdition.get(line.editionId)
        const isLatest = !current || acquiredAt > current.lastAcquiredAt
        byEdition.set(line.editionId, {
          nftId: line.nftId,
          name: line.name,
          tokenId: line.tokenId,
          image: line.image,
          editionId: line.editionId,
          editionLabel: line.editionLabel,
          quantity: (current?.quantity ?? 0) + line.quantity,
          totalPaid: new Decimal(current?.totalPaid ?? 0).plus(line.lineTotal).toFixed(),
          network: isLatest ? order.wallet.network : current.network,
          lastOrderId: isLatest ? order.id : current.lastOrderId,
          lastAcquiredAt: isLatest ? acquiredAt : current.lastAcquiredAt,
        })
      }
    }

    const items = [...byEdition.values()].sort((a, b) => b.lastAcquiredAt.localeCompare(a.lastAcquiredAt))
    const body: CollectionResponse = {
      items,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      pendingOrders: orders.filter((order) => order.status === 'pending').length,
    }
    return HttpResponse.json(body)
  }),
]
