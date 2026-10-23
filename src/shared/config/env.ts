import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().default('/api'),
  VITE_SOCKET_URL: z.string().default('wss://realtime.nft-marketplace.local'),
  VITE_ENABLE_MOCKS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
})

const parsed = envSchema.parse(import.meta.env)

export const env = {
  apiUrl: parsed.VITE_API_URL,
  socketUrl: parsed.VITE_SOCKET_URL,
  enableMocks: parsed.VITE_ENABLE_MOCKS,
}
