import type { NftSummary } from '@/shared/contracts/nft'
import { NftCard, NftCardSkeleton } from './nft-card'

const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-6 md:gap-y-8'

export function NftGrid({ items, priorityCount = 0 }: { items: NftSummary[]; priorityCount?: number }) {
  return (
    <ul className={gridClass}>
      {items.map((nft, index) => (
        <li key={nft.id}>
          <NftCard nft={nft} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  )
}

export function NftGridSkeleton({ count }: { count: number }) {
  return (
    <div className={gridClass} role="status" aria-label="Carregando NFTs">
      {Array.from({ length: count }, (_, index) => (
        <NftCardSkeleton key={index} />
      ))}
    </div>
  )
}
