import type { RealtimeEvent } from '@/shared/contracts/realtime'

export type RealtimeSignal = { kind: 'event'; event: RealtimeEvent } | { kind: 'reconnected' }

type Listener = (signal: RealtimeSignal) => void

const listeners = new Set<Listener>()

export const realtimeBus = {
  publish(signal: RealtimeSignal) {
    listeners.forEach((listener) => listener(signal))
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
