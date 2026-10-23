import { createNftFixtures, creatorFixtures, type CreatorRecord, type NftRecord } from './fixtures/nfts'

const STORAGE_KEY = 'nft-mock-db:v8'

export type MockDatabase = {
  nfts: NftRecord[]
  creators: CreatorRecord[]
  newsletterSubscribers: { email: string; subscribedAt: string }[]
}

function createInitialState(): MockDatabase {
  return {
    nfts: createNftFixtures(),
    creators: structuredClone(creatorFixtures),
    newsletterSubscribers: [{ email: 'colecionador@kurio.test', subscribedAt: '2026-09-01T12:00:00.000Z' }],
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
