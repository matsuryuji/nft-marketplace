import { Link } from '@tanstack/react-router'
import type { HomeContent } from '@/shared/contracts/home'
import { formatEth } from '@/shared/lib/eth'

type Spotlight = NonNullable<HomeContent['spotlight']>

export function SpotlightCard({ spotlight }: { spotlight: Spotlight }) {
  const { nft } = spotlight
  return (
    <section aria-labelledby="spotlight-title">
      <div className="rounded-t-[3px] bg-surface px-3.5 pt-4 pb-7">
        <h2 id="spotlight-title" className="text-base font-bold tracking-wide text-highlight uppercase">
          NFT em destaque
        </h2>
        <p className="mt-3 text-center text-[15px] font-bold tracking-wide uppercase">{spotlight.label}</p>
      </div>
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        aria-label={`${nft.name}, ${formatEth(nft.floorPrice, 2)}`}
        className="group relative -mt-4 block rounded-xl"
      >
        <img
          src={nft.image.url}
          alt={nft.image.alt}
          width={nft.image.width}
          height={nft.image.height}
          loading="lazy"
          className="aspect-[217/256] w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </Link>
    </section>
  )
}
