import type { ComponentProps } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { catalogRoute } from '../route-api'
import { activeFilterCount } from '../search'
import { CatalogFiltersSheet } from './catalog-filters-sheet'
import { CatalogSearchInput } from './catalog-search-input'

export function FilterTriggerButton({ className, ...props }: ComponentProps<'button'>) {
  const count = catalogRoute.useSearch({ select: activeFilterCount })
  return (
    <button
      type="button"
      aria-label={count > 0 ? `Filtros (${count} ativos)` : 'Filtros'}
      {...props}
      className={cn(
        'relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground',
        className,
      )}
    >
      <SlidersHorizontal className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background"
        >
          {count}
        </span>
      )}
    </button>
  )
}

export function CatalogMobileBar() {
  return (
    <div className="flex gap-3 md:hidden">
      <CatalogSearchInput />
      <CatalogFiltersSheet trigger={<FilterTriggerButton />} />
    </div>
  )
}
