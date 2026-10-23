import { Link } from '@tanstack/react-router'
import type { NftRarity, NftSummary } from '@/shared/contracts/nft'
import { formatEth } from '@/shared/lib/eth'
import { Skeleton } from '@/shared/ui/skeleton'

const rarityLabels: Record<Exclude<NftRarity, 'common'>, string> = {
  rare: 'Raro',
  legendary: 'Lendário',
}

type NftCardProps = {
  nft: NftSummary
  priority?: boolean
}

export function NftCard({ nft, priority = false }: NftCardProps) {
  const soldOut = nft.available === 0
  const tag = soldOut ? 'Esgotado' : nft.rarity !== 'common' ? rarityLabels[nft.rarity] : null

  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative rounded-lg bg-surface p-2">
        <img
          src={nft.image.url}
          alt={nft.image.alt}
          width={nft.image.width}
          height={nft.image.height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className="aspect-square w-full rounded-md object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {tag && (
          <span className="absolute top-2 left-2 rounded-tl-md rounded-br-md bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground uppercase">
            {tag}
          </span>
        )}
      </div>
      <div className="space-y-1 px-1">
        <h3 className="truncate text-xs sm:text-sm">
          <Link
            to="/nfts/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none group-has-[:focus-visible]:underline"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-bold">
          <span className="text-highlight">
            <span className="sr-only">{soldOut ? 'Último preço: ' : 'Preço: '}</span>
            {formatEth(nft.floorPrice, 2)}
          </span>
          {nft.compareAtPrice && (
            <s className="text-xs font-normal text-muted-foreground">
              <span className="sr-only">Preço anterior: </span>
              {formatEth(nft.compareAtPrice, 2)}
            </s>
          )}
        </p>
      </div>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg bg-surface p-2">
        <Skeleton className="aspect-square rounded-md" />
      </div>
      <div className="space-y-2 px-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}
