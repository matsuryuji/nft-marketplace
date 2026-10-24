import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { env } from '@/shared/config/env'
import { REALTIME_EVENTS, type NftUpdatedEvent, type OrderUpdatedEvent, type RealtimeEvent } from '@/shared/contracts/realtime'
import { db, type OrderRecord } from '../db'
import type { NftRecord } from '../fixtures/nfts'
import { SESSION_COOKIE } from '../fixtures/users'
import { toOrder } from '../lib/checkout'
import { randomToken } from '../lib/crypto'
import { floorPrice, totalAvailable } from '../serializers'

const PING_INTERVAL_MS = 20_000
const HISTORY_LIMIT = 50

type Connection = {
  id: string
  userId: string | null
  emit: (event: RealtimeEvent) => void
  close: () => void
}

type Published = { event: RealtimeEvent; targetUserId: string | null }

const connections = new Map<string, Connection>()
const history: Published[] = []
let available = true

const socketLink = ws.link(env.socketUrl)

function sessionUserId() {
  const token = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1)
  if (!token) return null
  const session = db.state.sessions.find((item) => item.token === token)
  return session && new Date(session.expiresAt).getTime() > Date.now() ? session.userId : null
}

export const realtimeHandler = socketLink.addEventListener('connection', (connection) => {
  if (!available) {
    connection.client.close(1000, 'realtime unavailable')
    return
  }
  const io = toSocketIo(connection)
  const id = randomToken(6)
  const ping = window.setInterval(() => connection.client.send('2'), PING_INTERVAL_MS)
  connections.set(id, {
    id,
    userId: sessionUserId(),
    emit: (event) => io.client.emit(event.type, event),
    close: () => connection.client.close(1000, 'dropped by mock'),
  })
  connection.client.addEventListener('close', () => {
    window.clearInterval(ping)
    connections.delete(id)
  })
})

function publish(event: RealtimeEvent, targetUserId: string | null) {
  history.push({ event, targetUserId })
  if (history.length > HISTORY_LIMIT) history.shift()
  for (const connection of connections.values()) {
    if (targetUserId && connection.userId !== targetUserId) continue
    connection.emit(event)
  }
}

function nftEvent(nft: NftRecord, overrides?: Partial<Pick<NftUpdatedEvent, 'version'>>): NftUpdatedEvent {
  return {
    eventId: `evt-${randomToken(8)}`,
    type: REALTIME_EVENTS.nftUpdated,
    resource: { type: 'nft', id: nft.id },
    version: overrides?.version ?? nft.version,
    occurredAt: new Date().toISOString(),
    data: {
      nftId: nft.id,
      name: nft.name,
      floorPrice: floorPrice(nft),
      available: totalAvailable(nft),
      editions: nft.editions.map((edition) => ({
        id: edition.id,
        label: edition.label,
        price: edition.price,
        available: edition.available,
      })),
    },
  }
}

export function publishNftUpdated(nft: NftRecord) {
  publish(nftEvent(nft), null)
}

export function publishOrderUpdated(order: OrderRecord) {
  const event: OrderUpdatedEvent = {
    eventId: `evt-${randomToken(8)}`,
    type: REALTIME_EVENTS.orderUpdated,
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: new Date().toISOString(),
    data: { order: toOrder(order) },
  }
  publish(event, order.userId)
}

export const realtimeControls = {
  get connections() {
    return [...connections.values()].map(({ id, userId }) => ({ id, userId }))
  },
  updateEdition(nftId: string, editionId: string, patch: { price?: string; available?: number }) {
    const nft = db.state.nfts.find((item) => item.id === nftId)
    const edition = nft?.editions.find((item) => item.id === editionId)
    if (!nft || !edition) throw new Error(`Edição ${editionId} não encontrada em ${nftId}`)
    if (patch.price !== undefined) edition.price = patch.price
    if (patch.available !== undefined) edition.available = patch.available
    nft.version += 1
    db.persist()
    publishNftUpdated(nft)
    return nftEvent(nft).data
  },
  replayLast() {
    const last = history[history.length - 1]
    if (last) publish(last.event, last.targetUserId)
    return last?.event.eventId ?? null
  },
  emitStale(nftId: string) {
    const nft = db.state.nfts.find((item) => item.id === nftId)
    if (!nft) throw new Error(`NFT ${nftId} não encontrado`)
    const stale = nftEvent(nft, { version: Math.max(0, nft.version - 1) })
    stale.data.editions = stale.data.editions.map((edition) => ({ ...edition, price: '999' }))
    stale.data.floorPrice = '999'
    publish(stale, null)
    return stale.eventId
  },
  disconnectAll() {
    for (const connection of connections.values()) connection.close()
  },
  setAvailable(next: boolean) {
    available = next
    if (!next) this.disconnectAll()
  },
}
