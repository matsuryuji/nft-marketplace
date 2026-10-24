import { createContext, useContext } from 'react'

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting'

export const RealtimeStatusContext = createContext<RealtimeStatus>('idle')

export function useRealtimeStatus() {
  return useContext(RealtimeStatusContext)
}
