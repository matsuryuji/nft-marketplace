import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useLogout } from './session'

export function useSignOut() {
  const router = useRouter()
  const mutation = useLogout()

  const signOut = () =>
    mutation.mutate(undefined, {
      onSettled: async () => {
        toast.success('Você saiu da sua conta.')
        const onPrivateRoute = router.state.matches.some((match) => match.routeId.startsWith('/_auth'))
        if (onPrivateRoute) await router.navigate({ to: '/' })
        else await router.invalidate()
      },
    })

  return { signOut, isPending: mutation.isPending }
}
