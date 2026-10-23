import { http, parseResponse } from '@/shared/api/client'
import { newsletterResponseSchema, type NewsletterRequest } from '@/shared/contracts/home'

export async function subscribeNewsletter(body: NewsletterRequest) {
  const { data } = await http.post('/newsletter', body)
  return parseResponse(newsletterResponseSchema, data)
}
