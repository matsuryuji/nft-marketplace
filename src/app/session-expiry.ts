import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { applySession } from '@/features/auth/session'
import { onSessionExpired } from '@/shared/api/client'
import type { createAppRouter } from './router'

export function installSessionExpiryHandler(queryClient: QueryClient, router: ReturnType<typeof createAppRouter>) {
  return onSessionExpired((error) => {
    applySession(queryClient, null)
    const { pathname, searchStr } = router.state.location
    if (new URLSearchParams(searchStr).get('auth')) return
    toast.warning(
      error.code === 'SESSION_EXPIRED' ? 'Sua sessão expirou. Entre novamente para continuar.' : error.message,
      { id: 'session-expired' },
    )
    void router.navigate({
      to: '.',
      search: (prev) => ({ ...prev, auth: 'login' as const, redirect: `${pathname}${searchStr}` }),
      replace: true,
    })
  })
}
