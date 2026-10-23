import { useEffect, useState } from 'react'
import { SearchIcon } from '@/shared/icons'
import { cn } from '@/shared/lib/utils'
import { catalogRoute } from '../route-api'
import { useCatalogNavigation } from '../use-catalog-navigation'

const DEBOUNCE_MS = 350

export function CatalogSearchInput({ className }: { className?: string }) {
  const q = catalogRoute.useSearch({ select: (search) => search.q ?? '' })
  const { updateFilters } = useCatalogNavigation()
  const [value, setValue] = useState(q)

  useEffect(() => setValue(q), [q])

  useEffect(() => {
    const term = value.trim()
    if (term === q) return
    const timeout = window.setTimeout(
      () => updateFilters({ q: term || undefined }, { replace: true }),
      DEBOUNCE_MS,
    )
    return () => window.clearTimeout(timeout)
  }, [value, q, updateFilters])

  return (
    <form
      role="search"
      className={cn('relative flex-1', className)}
      onSubmit={(event) => {
        event.preventDefault()
        updateFilters({ q: value.trim() || undefined })
      }}
    >
      <label htmlFor="catalog-search" className="sr-only">
        Explorar coleções
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-foreground/70" />
      <input
        id="catalog-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Explorar coleções"
        maxLength={80}
        autoComplete="off"
        className="h-11 w-full rounded-xl border border-surface-strong bg-surface pr-3 pl-10 text-sm placeholder:text-foreground/60"
      />
    </form>
  )
}
