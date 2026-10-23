import { queryOptions } from '@tanstack/react-query'
import { fetchHomeContent } from './api'

export const homeKeys = {
  content: () => ['home', 'content'] as const,
}

export const homeContentQuery = () =>
  queryOptions({
    queryKey: homeKeys.content(),
    queryFn: ({ signal }) => fetchHomeContent(signal),
    staleTime: 5 * 60_000,
  })
