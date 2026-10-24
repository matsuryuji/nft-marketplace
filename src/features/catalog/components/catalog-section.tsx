import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { EmptyState } from '@/shared/components/empty-state'
import { QueryErrorState } from '@/shared/components/query-error-state'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { nftListQuery } from '../queries'
import { catalogRoute } from '../route-api'
import { CATALOG_PAGE_SIZE, hasActiveFilters, toNftListParams } from '../search'
import { useCatalogNavigation } from '../use-catalog-navigation'
import { CatalogFilters } from './catalog-filters'
import { CatalogFiltersSheet } from './catalog-filters-sheet'
import { FilterTriggerButton } from './catalog-mobile-bar'
import { CatalogPagination } from './catalog-pagination'
import { CatalogSortSelect } from './catalog-sort-select'
import { CatalogTabs } from './catalog-tabs'
import { NftGrid, NftGridSkeleton } from './nft-grid'

export function CatalogSection({ aside }: { aside?: ReactNode }) {
  const search = catalogRoute.useSearch()
  const { updateFilters, clearFilters } = useCatalogNavigation()
  const query = useQuery(nftListQuery(toNftListParams(search)))

  return (
    <section id="catalog" aria-labelledby="catalog-title" className="scroll-mt-20">
      <h2 id="catalog-title" className="sr-only">
        Catálogo de NFTs
      </h2>
      <div className="grid gap-8 lg:grid-cols-[14.5rem_minmax(0,1fr)]">
        <div className="hidden space-y-6 lg:block">
          <aside aria-label="Filtros" className="rounded-lg bg-surface p-4">
            <CatalogFilters facets={query.data?.facets} />
          </aside>
          {aside}
        </div>

        <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CatalogTabs />
            <div className="flex items-center gap-3">
              <CatalogFiltersSheet trigger={<FilterTriggerButton className="hidden size-9 md:flex lg:hidden" />} />
              <CatalogSortSelect className="hidden md:flex" />
            </div>
          </div>

          <div className="flex min-h-5 flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {search.q && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-strong py-1 pr-1 pl-3 text-foreground">
                Busca: “{search.q}”
                <button
                  type="button"
                  onClick={() => updateFilters({ q: undefined })}
                  aria-label="Limpar busca"
                  className="rounded-full p-1 hover:bg-background/40"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            )}
            <p aria-live="polite" aria-atomic="true">
              {query.isSuccess &&
                `${query.data.total} ${query.data.total === 1 ? 'NFT encontrado' : 'NFTs encontrados'}`}
              {query.isFetching && !query.isPending && ' · Atualizando…'}
            </p>
          </div>

          {query.isPending ? (
            <NftGridSkeleton count={CATALOG_PAGE_SIZE} />
          ) : query.isError ? (
            <QueryErrorState
              error={query.error}
              title="Não foi possível carregar o catálogo"
              onRetry={() => query.refetch()}
              isRetrying={query.isFetching}
            />
          ) : query.data.items.length === 0 ? (
            <EmptyState
              title="Nenhum NFT encontrado"
              description={
                hasActiveFilters(search)
                  ? 'Tente ajustar a busca ou remover alguns filtros.'
                  : 'Ainda não há itens nesta seção.'
              }
              action={
                hasActiveFilters(search) ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div
              className={cn('space-y-8 transition-opacity', query.isPlaceholderData && 'opacity-60')}
              aria-busy={query.isPlaceholderData}
            >
              <NftGrid items={query.data.items} />
              <CatalogPagination page={query.data.page} totalPages={query.data.totalPages} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
