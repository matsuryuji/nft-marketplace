import { http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import { loginRequestSchema, registerRequestSchema } from '@/shared/contracts/auth'
import { db } from '../db'
import { hashPassword, randomToken } from '../lib/crypto'
import { errorResponse, simulateNetwork } from '../lib/http'
import {
  clearedSessionCookie,
  createSession,
  requireSession,
  revokeSession,
  sessionCookie,
  toUser,
} from '../lib/session'
import { CART_COOKIE } from '../fixtures/coupons'
import { SESSION_COOKIE } from '../fixtures/users'
import { clearedCartCookie, mergeGuestCart } from '../lib/cart'
import { scenarioStore } from '../scenarios'

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return Object.fromEntries(issues.map((issue) => [String(issue.path[0]), issue.message]))
}

function sessionHeaders(cookies: Record<string, string>, userId: string, session: { token: string; expiresAt: string }) {
  const headers = new Headers()
  headers.append('Set-Cookie', sessionCookie(session.token, session.expiresAt))
  if (mergeGuestCart(cookies[CART_COOKIE], userId)) headers.append('Set-Cookie', clearedCartCookie)
  return headers
}

const serviceUnavailable = () =>
  errorResponse(503, 'SERVICE_UNAVAILABLE', 'Serviço de autenticação indisponível. Tente novamente.')

export const authHandlers = [
  http.get(`${env.apiUrl}/session`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (!cookies[SESSION_COOKIE]) return HttpResponse.json(null)
    const result = requireSession(cookies)
    if (!result.ok) return result.response
    return HttpResponse.json({ user: toUser(result.user), expiresAt: result.expiresAt })
  }),

  http.post(`${env.apiUrl}/session`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (scenarioStore.current === 'server-error') return serviceUnavailable()

    const parsed = loginRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Verifique os dados informados.', fieldErrors(parsed.error.issues))
    }

    const email = parsed.data.email.toLowerCase()
    const user = db.state.users.find((item) => item.email === email)
    const hash = user ? await hashPassword(user.passwordSalt, parsed.data.password) : null
    if (!user || hash !== user.passwordHash) {
      return errorResponse(401, 'UNAUTHENTICATED', 'E-mail ou senha inválidos.')
    }

    const session = createSession(user.id)
    return HttpResponse.json(
      { user: toUser(user), expiresAt: session.expiresAt },
      { headers: sessionHeaders(cookies, user.id, session) },
    )
  }),

  http.delete(`${env.apiUrl}/session`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const token = cookies[SESSION_COOKIE]
    const userId = db.state.sessions.find((item) => item.token === token)?.userId
    if (userId) db.state.walletSessions = db.state.walletSessions.filter((item) => item.userId !== userId)
    revokeSession(token)
    return new HttpResponse(null, { status: 204, headers: { 'Set-Cookie': clearedSessionCookie } })
  }),

  http.post(`${env.apiUrl}/accounts`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (scenarioStore.current === 'server-error') return serviceUnavailable()

    const parsed = registerRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Verifique os dados informados.', fieldErrors(parsed.error.issues))
    }

    const { state } = db
    const username = parsed.data.username.toLowerCase()
    const email = parsed.data.email.toLowerCase()
    const conflicts: Record<string, string> = {}
    if (state.users.some((item) => item.email === email)) conflicts.email = 'Este e-mail já está cadastrado'
    if (state.users.some((item) => item.username === username)) conflicts.username = 'Este nome de usuário já está em uso'
    if (Object.keys(conflicts).length > 0) {
      return errorResponse(409, 'CONFLICT', 'Já existe uma conta com esses dados.', conflicts)
    }

    const salt = randomToken(6)
    const user = {
      id: `user-${randomToken(6)}`,
      username,
      displayName: parsed.data.username,
      email,
      avatarUrl: null,
      ensName: null,
      walletNickname: parsed.data.username,
      passwordSalt: salt,
      passwordHash: await hashPassword(salt, parsed.data.password),
      createdAt: new Date().toISOString(),
    }
    state.users.push(user)
    db.persist()

    const session = createSession(user.id)
    return HttpResponse.json(
      { user: toUser(user), expiresAt: session.expiresAt },
      { status: 201, headers: sessionHeaders(cookies, user.id, session) },
    )
  }),
]
