import { http, parseResponse } from '@/shared/api/client'
import { collectionResponseSchema } from '@/shared/contracts/collection'

export async function fetchCollection(signal?: AbortSignal) {
  const { data } = await http.get('/collection', { signal })
  return parseResponse(collectionResponseSchema, data)
}
