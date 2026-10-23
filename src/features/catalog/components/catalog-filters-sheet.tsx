import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'
import { nftListQuery } from '../queries'
import { catalogRoute } from '../route-api'
import { toNftListParams } from '../search'
import { CatalogFilters } from './catalog-filters'
import { CatalogSortSelect } from './catalog-sort-select'

export function CatalogFiltersSheet({ trigger }: { trigger: ReactNode }) {
  const search = catalogRoute.useSearch()
  const { data } = useQuery(nftListQuery(toNftListParams(search)))

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="left" className="w-[85%] max-w-sm overflow-y-auto border-surface-strong bg-surface">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Os resultados são atualizados a cada alteração.</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-8">
          <CatalogSortSelect />
          <CatalogFilters facets={data?.facets} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
