import { useId } from 'react'
import { nftSorts, type NftSort } from '@/shared/contracts/nft'
import { cn } from '@/shared/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { catalogRoute } from '../route-api'
import { sortLabels } from '../search'
import { useCatalogNavigation } from '../use-catalog-navigation'

export function CatalogSortSelect({ className }: { className?: string }) {
  const id = useId()
  const sort = catalogRoute.useSearch({ select: (search) => search.sort })
  const { updateFilters } = useCatalogNavigation()

  return (
    <div className={cn('flex items-center gap-1 text-xs', className)}>
      <span id={id} className="whitespace-nowrap text-foreground/80">
        Ordenar por:
      </span>
      <Select value={sort} onValueChange={(value) => updateFilters({ sort: value as NftSort })}>
        <SelectTrigger
          aria-labelledby={id}
          className="h-8 gap-1 border-none bg-transparent px-1 text-xs shadow-none focus-visible:ring-2 dark:bg-transparent"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {nftSorts.map((option) => (
            <SelectItem key={option} value={option} className="text-xs">
              {sortLabels[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
