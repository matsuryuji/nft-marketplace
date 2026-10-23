import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { toast } from 'sonner'
import { clearPrivateData, sessionKeys, sessionQuery } from '@/features/auth/session'
import type { Session } from '@/shared/contracts/auth'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, location }) => {
    const previous = context.queryClient.getQueryData<Session | null>(sessionKeys.current())
    const session = await context.queryClient.fetchQuery({ ...sessionQuery(), staleTime: 0 })
    if (!session) {
      if (previous) {
        clearPrivateData(context.queryClient)
        toast.warning('Sua sessão expirou. Entre novamente para continuar.', { id: 'session-expired' })
      }
      throw redirect({ to: '/', search: { auth: 'login', redirect: location.href } })
    }
    return { session }
  },
  component: Outlet,
})
