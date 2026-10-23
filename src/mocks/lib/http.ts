import { delay, HttpResponse } from 'msw'
import type { ApiErrorCode } from '@/shared/contracts/common'
import { scenarioStore } from '../scenarios'
import { hashString } from './random'

export async function simulateNetwork(request: Request) {
  const scenario = scenarioStore.current
  if (scenario === 'offline') return HttpResponse.error()
  if (scenario === 'timeout') {
    await delay('infinite')
    return null
  }
  const { min, max } = scenarioStore.definition.latency
  const spread = max - min
  await delay(spread === 0 ? min : min + (hashString(request.url) % (spread + 1)))
  return null
}

export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
) {
  return HttpResponse.json({ error: { code, message, fields } }, { status })
}
