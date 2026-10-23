import { useEffect, useMemo, useState } from 'react'
import Decimal from 'decimal.js'
import { nftCategories, nftNetworks, type NftFacets } from '@/shared/contracts/nft'
import { formatEthAmount } from '@/shared/lib/eth'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'
import { Slider } from '@/shared/ui/slider'
import { catalogRoute } from '../route-api'
import { categoryLabels, hasActiveFilters, networkLabels } from '../search'
import { useCatalogNavigation } from '../use-catalog-navigation'

const PRICE_STEP = 0.01

type FacetOption = { value: string; label: string; count?: number; selected: boolean }

function FacetList({
  title,
  options,
  onToggle,
}: {
  title: string
  options: FacetOption[]
  onToggle: (value: string, selected: boolean) => void
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-bold">{title}</legend>
      <ul className="space-y-1">
        {options.map((option) => (
          <li key={option.value}>
            <button
              type="button"
              aria-pressed={option.selected}
              onClick={() => onToggle(option.value, !option.selected)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-surface-strong',
                option.selected ? 'bg-surface-strong font-bold text-highlight' : 'text-muted-foreground',
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-1.5 rounded-full',
                    option.selected ? 'bg-highlight' : 'bg-transparent',
                  )}
                />
                {option.label}
              </span>
              {option.count === undefined ? (
                <Skeleton className="h-3 w-6" />
              ) : (
                <span className="tabular-nums">
                  ({option.count})<span className="sr-only"> itens</span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}

function toBounds(facets?: NftFacets) {
  if (!facets) return null
  const min = new Decimal(facets.priceRange.min).toDecimalPlaces(2, Decimal.ROUND_DOWN).toNumber()
  const max = new Decimal(facets.priceRange.max).toDecimalPlaces(2, Decimal.ROUND_UP).toNumber()
  return max > min ? { min, max } : null
}

function PriceRange({ facets }: { facets?: NftFacets }) {
  const search = catalogRoute.useSearch()
  const { updateFilters } = useCatalogNavigation()
  const bounds = useMemo(() => toBounds(facets), [facets])
  const [range, setRange] = useState<[number, number] | null>(null)

  useEffect(() => setRange(null), [search.minPrice, search.maxPrice])

  if (!bounds) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold">Faixa de preço</p>
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const current: [number, number] = range ?? [
    search.minPrice ? Number(search.minPrice) : bounds.min,
    search.maxPrice ? Number(search.maxPrice) : bounds.max,
  ]
  const toParam = (value: number, edge: number) =>
    value === edge ? undefined : new Decimal(value).toFixed(2)

  return (
    <div className="space-y-3">
      <p id="price-range-label" className="text-sm font-bold">
        Faixa de preço
      </p>
      <Slider
        min={bounds.min}
        max={bounds.max}
        step={PRICE_STEP}
        value={current}
        minStepsBetweenThumbs={1}
        onValueChange={(value) => setRange([value[0], value[1]])}
        aria-labelledby="price-range-label"
        thumbLabels={['Preço mínimo', 'Preço máximo']}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Preço: {formatEthAmount(String(current[0]), 2)} - {formatEthAmount(String(current[1]), 2)} ETH
      </p>
      <button
        type="button"
        onClick={() =>
          updateFilters({ minPrice: toParam(current[0], bounds.min), maxPrice: toParam(current[1], bounds.max) })
        }
        className="h-8 rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground hover:opacity-90"
      >
        Aplicar
      </button>
    </div>
  )
}

export function CatalogFilters({ facets }: { facets?: NftFacets }) {
  const search = catalogRoute.useSearch()
  const { updateFilters, clearFilters } = useCatalogNavigation()
  const categories = search.category ?? []
  const networks = search.network ?? []

  const toggle = <T extends string>(list: T[], value: T, selected: boolean) => {
    const next = selected ? [...list, value] : list.filter((item) => item !== value)
    return next.length ? next : undefined
  }

  return (
    <div className="space-y-6">
      <FacetList
        title="Coleções"
        options={nftCategories.map((category) => ({
          value: category,
          label: categoryLabels[category],
          count: facets?.category[category],
          selected: categories.includes(category),
        }))}
        onToggle={(value, selected) =>
          updateFilters({ category: toggle(categories, value as (typeof categories)[number], selected) })
        }
      />
      <PriceRange facets={facets} />
      <FacetList
        title="Rede"
        options={nftNetworks.map((network) => ({
          value: network,
          label: networkLabels[network],
          count: facets?.network[network],
          selected: networks.includes(network),
        }))}
        onToggle={(value, selected) =>
          updateFilters({ network: toggle(networks, value as (typeof networks)[number], selected) })
        }
      />
      {hasActiveFilters(search) && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-xs text-highlight underline-offset-4 hover:underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
