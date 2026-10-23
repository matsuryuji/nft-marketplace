import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { cn } from '@/shared/lib/utils'
import { relatedNftsQuery } from '../queries'

const itemClass =
  'w-[calc((100%-1rem)/2.2)] shrink-0 snap-start md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)]'

function trackMetrics(track: HTMLUListElement, itemCount: number) {
  const item = track.firstElementChild as HTMLElement | null
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0
  const step = (item?.offsetWidth ?? track.clientWidth) + gap
  const perView = Math.max(1, Math.round((track.clientWidth + gap) / step))
  return { step: step * perView, pages: Math.max(1, Math.ceil(itemCount / perView)) }
}

function usePagedScroll(itemCount: number) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [state, setState] = useState({ page: 0, pages: 1 })

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const { step, pages } = trackMetrics(track, itemCount)
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2
    const page = atEnd ? pages - 1 : Math.min(pages - 1, Math.round(track.scrollLeft / step))
    setState((prev) => (prev.page === page && prev.pages === pages ? prev : { page, pages }))
  }, [itemCount])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    track.addEventListener('scroll', measure, { passive: true })
    return () => {
      observer.disconnect()
      track.removeEventListener('scroll', measure)
    }
  }, [measure])

  const goTo = (page: number) => {
    const track = trackRef.current
    if (!track) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({ left: page * trackMetrics(track, itemCount).step, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return { trackRef, ...state, goTo }
}

export function RelatedCarousel({ nftId }: { nftId: string }) {
  const query = useQuery(relatedNftsQuery(nftId))
  const items = query.data?.items ?? []
  const { trackRef, page, pages, goTo } = usePagedScroll(items.length)

  if (query.isError || (query.isSuccess && items.length === 0)) return null

  return (
    <section aria-labelledby="related-title" className="space-y-5">
      <h2 id="related-title" className="border-b border-foreground/10 pb-2 text-[15px] font-bold text-highlight">
        Mais desta coleção
      </h2>

      <ul
        ref={trackRef}
        aria-label={query.data ? `NFTs da coleção ${query.data.collection}` : 'Carregando NFTs da coleção'}
        aria-busy={query.isPending}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {query.isPending
          ? Array.from({ length: 5 }, (_, index) => (
              <li key={index} className={itemClass}>
                <NftCardSkeleton />
              </li>
            ))
          : items.map((nft) => (
              <li key={nft.id} className={itemClass}>
                <NftCard nft={nft} />
              </li>
            ))}
      </ul>

      {pages > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ir para a página ${index + 1} de ${pages}`}
              aria-current={index === page ? 'true' : undefined}
              className="flex size-5 items-center justify-center rounded-full"
            >
              <span
                className={cn(
                  'size-2.5 rounded-full border border-primary transition-colors',
                  index === page && 'bg-primary',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
