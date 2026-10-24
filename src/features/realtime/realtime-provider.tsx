import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { privateKeys, useSession } from '@/features/auth/session'
import { cartKey } from '@/features/cart/queries'
import { nftKeys } from '@/features/catalog/queries'
import { homeKeys } from '@/features/home/queries'
import { nftUpdatedEventSchema, orderUpdatedEventSchema, REALTIME_EVENTS } from '@/shared/contracts/realtime'
import { applyNftUpdated, applyOrderUpdated } from './apply'
import { realtimeBus } from './bus'
import { RealtimeEventGuard } from './event-guard'
import { RealtimeStatusContext, type RealtimeStatus } from './realtime-context'
import { createRealtimeSocket } from './socket'

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { user, isPending } = useSession()
  const userId = user?.id ?? null
  const [status, setStatus] = useState<RealtimeStatus>('idle')

  useEffect(() => {
    if (isPending) return
    let socket: Socket | null = null
    let disposed = false
    const guard = new RealtimeEventGuard()
    let everConnected = false
    let lostConnection = false

    const reconcile = () => {
      void queryClient.invalidateQueries({ queryKey: nftKeys.all, refetchType: 'active' })
      void queryClient.invalidateQueries({ queryKey: homeKeys.content(), refetchType: 'active' })
      void queryClient.invalidateQueries({ queryKey: cartKey(userId) })
      if (userId) void queryClient.invalidateQueries({ queryKey: [...privateKeys.user(userId), 'orders'] })
      realtimeBus.publish({ kind: 'reconnected' })
    }

    const onConnect = () => {
      setStatus('connected')
      if (everConnected && lostConnection) {
        reconcile()
        toast.success('Conexão em tempo real restabelecida.', { id: 'realtime-status', description: 'Os dados foram sincronizados.' })
      }
      everConnected = true
      lostConnection = false
    }

    const onDisconnect = (reason: string) => {
      if (reason === 'io client disconnect') return
      lostConnection = true
      setStatus('reconnecting')
      toast.warning('Conexão em tempo real perdida.', { id: 'realtime-status', description: 'Tentando reconectar…' })
    }

    const onNftUpdated = (payload: unknown) => {
      const parsed = nftUpdatedEventSchema.safeParse(payload)
      if (!parsed.success || !guard.accept(parsed.data)) return
      applyNftUpdated(queryClient, userId, parsed.data)
      realtimeBus.publish({ kind: 'event', event: parsed.data })
    }

    const onOrderUpdated = (payload: unknown) => {
      const parsed = orderUpdatedEventSchema.safeParse(payload)
      if (!parsed.success || !guard.accept(parsed.data)) return
      applyOrderUpdated(queryClient, userId, parsed.data, router)
      realtimeBus.publish({ kind: 'event', event: parsed.data })
    }

    setStatus('connecting')
    void createRealtimeSocket().then((created) => {
      if (disposed) return
      socket = created
      socket.on('connect', onConnect)
      socket.on('disconnect', onDisconnect)
      socket.on('connect_error', () => setStatus(everConnected ? 'reconnecting' : 'connecting'))
      socket.on(REALTIME_EVENTS.nftUpdated, onNftUpdated)
      socket.on(REALTIME_EVENTS.orderUpdated, onOrderUpdated)
      socket.connect()
    })

    return () => {
      disposed = true
      socket?.off()
      socket?.disconnect()
      setStatus('idle')
    }
  }, [isPending, userId, queryClient, router])

  return <RealtimeStatusContext.Provider value={status}>{children}</RealtimeStatusContext.Provider>
}
