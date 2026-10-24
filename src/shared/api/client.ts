import axios, { isAxiosError, isCancel } from 'axios'
import type { z } from 'zod'
import { env } from '@/shared/config/env'
import { ApiError, toApiError } from './errors'
import { whenTransportReady } from './transport'

export const http = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: { indexes: null },
})

declare module 'axios' {
  interface AxiosRequestConfig {
    skipSessionExpiry?: boolean
  }
}

type SessionExpiredListener = (error: ApiError) => void
let sessionExpiredListener: SessionExpiredListener | null = null

export function onSessionExpired(listener: SessionExpiredListener) {
  sessionExpiredListener = listener
  return () => {
    if (sessionExpiredListener === listener) sessionExpiredListener = null
  }
}

http.interceptors.request.use(async (config) => {
  await whenTransportReady()
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isCancel(error)) return Promise.reject(error)
    const apiError = toApiError(error)
    const skip = isAxiosError(error) && error.config?.skipSessionExpiry
    if (!skip && apiError.status === 401) sessionExpiredListener?.(apiError)
    return Promise.reject(apiError)
  },
)

export function parseResponse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError({ code: 'INVALID_RESPONSE', message: 'Resposta inválida do servidor.' })
  }
  return result.data
}
