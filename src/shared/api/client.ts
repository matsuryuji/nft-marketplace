import axios, { isCancel } from 'axios'
import type { z } from 'zod'
import { env } from '@/shared/config/env'
import { ApiError, toApiError } from './errors'

export const http = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: { indexes: null },
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => (isCancel(error) ? Promise.reject(error) : Promise.reject(toApiError(error))),
)

export function parseResponse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError({ code: 'INVALID_RESPONSE', message: 'Resposta inválida do servidor.' })
  }
  return result.data
}
