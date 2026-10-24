import { createNftFixtures, creatorFixtures, type CreatorRecord, type NftRecord } from './fixtures/nfts'
import type { Buyer, OrderLine, Quote } from '@/shared/contracts/checkout'
import type { CartSummary } from '@/shared/contracts/cart'
import { userFixtures, type SessionRecord, type UserRecord } from './fixtures/users'
import { walletFixtures, type WalletRecord, type WalletSessionRecord } from './fixtures/wallets'

export type CartItemRecord = {
  id: string
  nftId: string
  editionId: string
  quantity: number
  baselinePrice: string
  addedAt: string
}

export type QuoteRecord = Quote & { userId: string; cartId: string }

export type OrderRecord = {
  id: string
  userId: string
  idempotencyKey: string
  payloadHash: string
  quoteId: string
  status: 'pending' | 'confirmed' | 'refused'
  plannedOutcome: 'confirmed' | 'refused'
  version: number
  items: OrderLine[]
  coupon: { code: string; description: string } | null
  summary: CartSummary
  buyer: Buyer
  wallet: { label: string; address: string; network: WalletRecord['network']; provider: WalletRecord['provider'] }
  transactionHash: string | null
  failureReason: string | null
  createdAt: string
  settlesAt: string
  settledAt: string | null
}

export type CartRecord = {
  id: string
  userId: string | null
  items: CartItemRecord[]
  couponCode: string | null
  version: number
  updatedAt: string
}

const STORAGE_KEY = 'nft-mock-db:v13'

export type MockDatabase = {
  nfts: NftRecord[]
  creators: CreatorRecord[]
  newsletterSubscribers: { email: string; subscribedAt: string }[]
  users: UserRecord[]
  sessions: SessionRecord[]
  carts: CartRecord[]
  wallets: WalletRecord[]
  walletSessions: WalletSessionRecord[]
  quotes: QuoteRecord[]
  orders: OrderRecord[]
  scenarioFlags: string[]
  favorites: { userId: string; nftId: string; createdAt: string }[]
}

function createInitialState(): MockDatabase {
  return {
    nfts: createNftFixtures(),
    creators: structuredClone(creatorFixtures),
    newsletterSubscribers: [{ email: 'colecionador@kurio.test', subscribedAt: '2026-09-01T12:00:00.000Z' }],
    users: structuredClone(userFixtures),
    sessions: [],
    carts: [],
    wallets: structuredClone(walletFixtures),
    walletSessions: [],
    quotes: [],
    orders: [],
    scenarioFlags: [],
    favorites: [
      { userId: 'user-1', nftId: 'nft-002', createdAt: '2026-09-20T12:00:00.000Z' },
      { userId: 'user-1', nftId: 'nft-007', createdAt: '2026-09-22T12:00:00.000Z' },
    ],
  }
}

function load(): MockDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MockDatabase
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
  return createInitialState()
}

let state = load()

export const db = {
  get state() {
    return state
  },
  persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  },
  reset() {
    state = createInitialState()
    localStorage.removeItem(STORAGE_KEY)
  },
}
