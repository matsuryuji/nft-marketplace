export type UserRecord = {
  id: string
  username: string
  displayName: string
  email: string
  avatarUrl: string | null
  ensName: string | null
  walletNickname: string
  passwordSalt: string
  passwordHash: string
  createdAt: string
}

export type SessionRecord = {
  token: string
  userId: string
  expiresAt: string
}

export const SESSION_TTL_MS = 30 * 60_000
export const SESSION_COOKIE = 'kurio_session'

export const userFixtures: UserRecord[] = [
  {
    id: 'user-1',
    username: 'colecionador',
    displayName: 'Colecionador Kurio',
    email: 'colecionador@kurio.test',
    avatarUrl: '/avatars/creator-3.svg',
    ensName: 'nova.kurio.eth',
    walletNickname: 'Cofre da Nova',
    passwordSalt: 'k7f2a9',
    passwordHash: 'f4f1051f296477d51b6e4be9bf2cf3b0a38e84793f02c540faf96d6f007022f5',
    createdAt: '2026-08-01T12:00:00.000Z',
  },
  {
    id: 'user-2',
    username: 'criadora',
    displayName: 'Criadora Kurio',
    email: 'criadora@kurio.test',
    avatarUrl: '/avatars/creator-6.svg',
    ensName: 'criadora.eth',
    walletNickname: 'Ateliê',
    passwordSalt: 'm3d8q1',
    passwordHash: 'f9b768dbe7ba7edf5702f47bb1d7c74d0dedafd3be8641c164d23fca082489f6',
    createdAt: '2026-08-15T12:00:00.000Z',
  },
]
