import { isAxiosError } from 'axios'
import { apiErrorBodySchema, type ApiErrorCode } from '@/shared/contracts/common'

export type ClientErrorCode = ApiErrorCode | 'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE'

export class ApiError extends Error {
  readonly code: ClientErrorCode
  readonly status: number | null
  readonly fields: Record<string, string>

  constructor(params: {
    code: ClientErrorCode
    message: string
    status?: number | null
    fields?: Record<string, string>
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.code = params.code
    this.status = params.status ?? null
    this.fields = params.fields ?? {}
  }

  get isTransient() {
    return (
      this.code === 'NETWORK_ERROR' ||
      this.code === 'TIMEOUT' ||
      this.code === 'SERVICE_UNAVAILABLE' ||
      this.code === 'RATE_LIMITED' ||
      this.code === 'INTERNAL_ERROR'
    )
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({ code: 'TIMEOUT', message: 'A requisição excedeu o tempo limite.' })
    }
    if (!error.response) {
      return new ApiError({ code: 'NETWORK_ERROR', message: 'Não foi possível conectar ao servidor.' })
    }
    const body = apiErrorBodySchema.safeParse(error.response.data)
    if (body.success) {
      return new ApiError({ ...body.data.error, status: error.response.status })
    }
    return new ApiError({
      code: 'INTERNAL_ERROR',
      message: 'Ocorreu um erro inesperado.',
      status: error.response.status,
    })
  }

  return new ApiError({ code: 'INTERNAL_ERROR', message: 'Ocorreu um erro inesperado.' })
}
