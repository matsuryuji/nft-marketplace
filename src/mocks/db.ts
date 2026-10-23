import { createNftFixtures, creatorFixtures, type CreatorRecord, type NftRecord } from './fixtures/nfts'
import { userFixtures, type SessionRecord, type UserRecord } from './fixtures/users'

const STORAGE_KEY = 'nft-mock-db:v9'

export type MockDatabase = {
  nfts: NftRecord[]
  creators: CreatorRecord[]
  newsletterSubscribers: { email: string; subscribedAt: string }[]
  users: UserRecord[]
  sessions: SessionRecord[]
}

function createInitialState(): MockDatabase {
  return {
    nfts: createNftFixtures(),
    creators: structuredClone(creatorFixtures),
    newsletterSubscribers: [{ email: 'colecionador@kurio.test', subscribedAt: '2026-09-01T12:00:00.000Z' }],
    users: structuredClone(userFixtures),
    sessions: [],
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
