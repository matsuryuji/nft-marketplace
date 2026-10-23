import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/errors'

const MAX_QUERY_RETRIES = 2

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) =>
          error instanceof ApiError && error.isTransient && failureCount < MAX_QUERY_RETRIES,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4_000),
      },
      mutations: {
        retry: false,
      },
    },
  })
}
