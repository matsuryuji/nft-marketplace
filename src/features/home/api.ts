import { http, parseResponse } from '@/shared/api/client'
import { homeContentSchema } from '@/shared/contracts/home'

export async function fetchHomeContent(signal?: AbortSignal) {
  const { data } = await http.get('/home', { signal })
  return parseResponse(homeContentSchema, data)
}
