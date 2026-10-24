import type { RealtimeEvent } from '@/shared/contracts/realtime'

const SEEN_LIMIT = 500

export class RealtimeEventGuard {
  private readonly seen = new Set<string>()
  private readonly versions = new Map<string, number>()

  accept(event: RealtimeEvent) {
    if (this.seen.has(event.eventId)) return false
    this.remember(event.eventId)
    const key = `${event.resource.type}:${event.resource.id}`
    const current = this.versions.get(key)
    if (current !== undefined && event.version <= current) return false
    this.versions.set(key, event.version)
    return true
  }

  private remember(eventId: string) {
    this.seen.add(eventId)
    if (this.seen.size > SEEN_LIMIT) {
      const oldest = this.seen.values().next().value
      if (oldest) this.seen.delete(oldest)
    }
  }
}
