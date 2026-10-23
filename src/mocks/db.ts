import { createNftFixtures, creatorFixtures, type CreatorRecord, type NftRecord } from './fixtures/nfts'
import { userFixtures, type SessionRecord, type UserRecord } from './fixtures/users'

export type CartItemRecord = {
  id: string
  nftId: string
  editionId: string
  quantity: number
  baselinePrice: string
  addedAt: string
}

export type CartRecord = {
  id: string
  userId: string | null
  items: CartItemRecord[]
  couponCode: string | null
  version: number
  updatedAt: string
}

const STORAGE_KEY = 'nft-mock-db:v10'

export type MockDatabase = {
  nfts: NftRecord[]
  creators: CreatorRecord[]
  newsletterSubscribers: { email: string; subscribedAt: string }[]
  users: UserRecord[]
  sessions: SessionRecord[]
  carts: CartRecord[]
}

function createInitialState(): MockDatabase {
  return {
    nfts: createNftFixtures(),
    creators: structuredClone(creatorFixtures),
    newsletterSubscribers: [{ email: 'colecionador@kurio.test', subscribedAt: '2026-09-01T12:00:00.000Z' }],
    users: structuredClone(userFixtures),
    sessions: [],
    carts: [],
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
