import { http, parseResponse } from '@/shared/api/client'
import { ApiError } from '@/shared/api/errors'
import { sessionSchema, type LoginRequest, type RegisterRequest } from '@/shared/contracts/auth'

export async function fetchSession(signal?: AbortSignal) {
  try {
    const { data } = await http.get('/session', { signal, skipSessionExpiry: true })
    return parseResponse(sessionSchema, data)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export async function login(body: LoginRequest) {
  const { data } = await http.post('/session', body, { skipSessionExpiry: true })
  return parseResponse(sessionSchema, data)
}

export async function register(body: RegisterRequest) {
  const { data } = await http.post('/accounts', body, { skipSessionExpiry: true })
  return parseResponse(sessionSchema, data)
}

export async function logout() {
  await http.delete('/session', { skipSessionExpiry: true })
}
