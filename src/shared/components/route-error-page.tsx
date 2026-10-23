import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { QueryErrorState } from './query-error-state'

export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <section className="mx-auto max-w-xl px-4 py-24">
      <QueryErrorState
        error={error}
        title="Algo deu errado"
        onRetry={() => {
          reset()
          router.invalidate()
        }}
      />
    </section>
  )
}
