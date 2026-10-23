import { createFileRoute, redirect } from '@tanstack/react-router'
import { authSearchSchema } from '@/features/auth/auth-search'
import { sessionQuery } from '@/features/auth/session'

export const Route = createFileRoute('/register')({
  validateSearch: authSearchSchema.pick({ redirect: true }),
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery())
    if (session) throw redirect({ href: search.redirect ?? '/' })
    throw redirect({ to: '/', search: { auth: 'register', redirect: search.redirect } })
  },
})
