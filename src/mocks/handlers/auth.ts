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
import { SESSION_COOKIE } from '../fixtures/users'
import { scenarioStore } from '../scenarios'

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return Object.fromEntries(issues.map((issue) => [String(issue.path[0]), issue.message]))
}

const serviceUnavailable = () =>
  errorResponse(503, 'SERVICE_UNAVAILABLE', 'Serviço de autenticação indisponível. Tente novamente.')

export const authHandlers = [
  http.get(`${env.apiUrl}/session`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const result = requireSession(cookies)
    if (!result.ok) return result.response
    return HttpResponse.json({ user: toUser(result.user), expiresAt: result.expiresAt })
  }),

  http.post(`${env.apiUrl}/session`, async ({ request }) => {
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
      { headers: { 'Set-Cookie': sessionCookie(session.token, session.expiresAt) } },
    )
  }),

  http.delete(`${env.apiUrl}/session`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    revokeSession(cookies[SESSION_COOKIE])
    return new HttpResponse(null, { status: 204, headers: { 'Set-Cookie': clearedSessionCookie } })
  }),

  http.post(`${env.apiUrl}/accounts`, async ({ request }) => {
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
      passwordSalt: salt,
      passwordHash: await hashPassword(salt, parsed.data.password),
      createdAt: new Date().toISOString(),
    }
    state.users.push(user)
    db.persist()

    const session = createSession(user.id)
    return HttpResponse.json(
      { user: toUser(user), expiresAt: session.expiresAt },
      { status: 201, headers: { 'Set-Cookie': sessionCookie(session.token, session.expiresAt) } },
    )
  }),
]
