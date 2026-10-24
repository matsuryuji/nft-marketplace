import type { Socket } from 'socket.io-client'
import { env } from '@/shared/config/env'

export async function createRealtimeSocket(): Promise<Socket> {
  const { io } = await import('socket.io-client')
  return io(env.socketUrl, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4_000,
    timeout: 8_000,
  })
}
