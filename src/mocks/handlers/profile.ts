import { http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import {
  avatarUploadRequestSchema,
  changePasswordRequestSchema,
  updateProfileRequestSchema,
  type Profile,
} from '@/shared/contracts/profile'
import { db } from '../db'
import type { UserRecord } from '../fixtures/users'
import { hashPassword, randomToken } from '../lib/crypto'
import { errorResponse, simulateNetwork } from '../lib/http'
import { requireSession, toUser } from '../lib/session'
import { scenarioStore } from '../scenarios'

function toProfile(user: UserRecord): Profile {
  return { ...toUser(user), ensName: user.ensName, walletNickname: user.walletNickname }
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return Object.fromEntries(issues.map((issue) => [String(issue.path[0]), issue.message]))
}

const unavailable = () => errorResponse(503, 'SERVICE_UNAVAILABLE', 'Não foi possível salvar agora. Tente novamente.')

export const profileHandlers = [
  http.get(`${env.apiUrl}/profile`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    return HttpResponse.json(toProfile(auth.user))
  }),

  http.patch(`${env.apiUrl}/profile`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    if (scenarioStore.current === 'server-error') return unavailable()

    const parsed = updateProfileRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Verifique os dados do perfil.', fieldErrors(parsed.error.issues))
    }
    const username = parsed.data.username.toLowerCase()
    const email = parsed.data.email.toLowerCase()
    const others = db.state.users.filter((user) => user.id !== auth.user.id)
    const conflicts: Record<string, string> = {}
    if (others.some((user) => user.username === username)) conflicts.username = 'Este nome de usuário já está em uso'
    if (others.some((user) => user.email === email)) conflicts.email = 'Este e-mail já está cadastrado'
    if (Object.keys(conflicts).length > 0) return errorResponse(409, 'CONFLICT', 'Alguns dados já estão em uso.', conflicts)

    Object.assign(auth.user, { ...parsed.data, username, email })
    db.persist()
    return HttpResponse.json(toProfile(auth.user))
  }),

  http.put(`${env.apiUrl}/profile/password`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    if (scenarioStore.current === 'server-error') return unavailable()

    const parsed = changePasswordRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Verifique as senhas informadas.', fieldErrors(parsed.error.issues))
    }
    if ((await hashPassword(auth.user.passwordSalt, parsed.data.currentPassword)) !== auth.user.passwordHash) {
      return errorResponse(422, 'VALIDATION_ERROR', 'A senha atual está incorreta.', { currentPassword: 'Senha atual incorreta' })
    }
    if (parsed.data.currentPassword === parsed.data.newPassword) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Escolha uma senha diferente da atual.', {
        newPassword: 'A nova senha precisa ser diferente da atual',
      })
    }
    const salt = randomToken(6)
    auth.user.passwordSalt = salt
    auth.user.passwordHash = await hashPassword(salt, parsed.data.newPassword)
    db.persist()
    return new HttpResponse(null, { status: 204 })
  }),

  http.put(`${env.apiUrl}/profile/avatar`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    if (scenarioStore.current === 'server-error') return unavailable()

    const parsed = avatarUploadRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return errorResponse(422, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Imagem inválida.', {
        avatar: parsed.error.issues[0]?.message ?? 'Imagem inválida',
      })
    }
    auth.user.avatarUrl = parsed.data.dataUrl
    db.persist()
    return HttpResponse.json(toProfile(auth.user))
  }),

  http.delete(`${env.apiUrl}/profile/avatar`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    auth.user.avatarUrl = null
    db.persist()
    return HttpResponse.json(toProfile(auth.user))
  }),
]
