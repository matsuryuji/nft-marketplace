import type { User } from '@/shared/contracts/auth'
import { db } from '../db'
import { SESSION_COOKIE, SESSION_TTL_MS, type UserRecord } from '../fixtures/users'
import { errorResponse } from './http'
import { randomToken } from './crypto'

export function toUser(record: UserRecord): User {
  return {
    id: record.id,
    username: record.username,
    displayName: record.displayName,
    email: record.email,
    avatarUrl: record.avatarUrl,
  }
}

export function sessionCookie(token: string, expiresAt: string) {
  const maxAge = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000))
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

export const clearedSessionCookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`

export function createSession(userId: string) {
  const session = {
    token: randomToken(),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }
  const { state } = db
  state.sessions = state.sessions.filter((item) => new Date(item.expiresAt).getTime() > Date.now())
  state.sessions.push(session)
  db.persist()
  return session
}

export function revokeSession(token: string | undefined) {
  if (!token) return
  db.state.sessions = db.state.sessions.filter((item) => item.token !== token)
  db.persist()
}

type SessionResult =
  | { ok: true; user: UserRecord; token: string; expiresAt: string }
  | { ok: false; response: Response }

export function requireSession(cookies: Record<string, string>): SessionResult {
  const token = cookies[SESSION_COOKIE]
  if (!token) {
    return { ok: false, response: errorResponse(401, 'UNAUTHENTICATED', 'Faça login para continuar.') }
  }
  const { state } = db
  const session = state.sessions.find((item) => item.token === token)
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    revokeSession(token)
    return { ok: false, response: errorResponse(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.') }
  }
  const user = state.users.find((item) => item.id === session.userId)
  if (!user) {
    revokeSession(token)
    return { ok: false, response: errorResponse(401, 'UNAUTHENTICATED', 'Faça login para continuar.') }
  }
  return { ok: true, user, token, expiresAt: session.expiresAt }
}

export function expireAllSessions() {
  db.state.sessions = db.state.sessions.map((session) => ({ ...session, expiresAt: new Date(0).toISOString() }))
  db.persist()
}
