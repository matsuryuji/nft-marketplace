import { useRealtimeStatus } from './realtime-context'

export function RealtimeIndicator() {
  const status = useRealtimeStatus()
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-24 left-4 z-50 md:bottom-4">
      {status === 'reconnecting' && (
        <span className="flex items-center gap-2 rounded-full border border-warning/40 bg-surface px-3 py-1.5 text-xs shadow-lg">
          <span className="size-2 animate-pulse rounded-full bg-warning motion-reduce:animate-none" aria-hidden="true" />
          Reconectando ao tempo real…
        </span>
      )}
    </div>
  )
}
