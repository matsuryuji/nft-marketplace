import { useCallback } from 'react'
import { catalogRoute } from './route-api'
import type { CatalogSearch } from './search'

type FilterPatch = Partial<Omit<CatalogSearch, 'page'>>

export function useCatalogNavigation() {
  const navigate = catalogRoute.useNavigate()

  const updateFilters = useCallback(
    (patch: FilterPatch, options?: { replace?: boolean }) =>
      navigate({
        search: (prev) => ({ ...prev, ...patch, page: 1 }),
        replace: options?.replace,
        resetScroll: false,
      }),
    [navigate],
  )

  const clearFilters = useCallback(
    () => navigate({ search: (prev) => ({ tab: prev.tab, sort: prev.sort, page: 1 }), resetScroll: false }),
    [navigate],
  )

  return { updateFilters, clearFilters }
}
