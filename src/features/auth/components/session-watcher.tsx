import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { sessionKeys, useSession } from '../session'

const MAX_TIMEOUT_MS = 2_147_483_647

export function SessionWatcher() {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(() => {
    if (!session) return
    const delay = new Date(session.expiresAt).getTime() - Date.now()
    const timeout = window.setTimeout(
      async () => {
        await queryClient.invalidateQueries({ queryKey: sessionKeys.current() })
        await router.invalidate()
      },
      Math.min(Math.max(delay, 0), MAX_TIMEOUT_MS),
    )
    return () => window.clearTimeout(timeout)
  }, [session, queryClient, router])

  return null
}
