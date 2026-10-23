import { useCallback, useEffect, useRef, useState } from 'react'
import type { NftSummary } from '@/shared/contracts/nft'
import { NftCard, NftCardSkeleton } from './nft-card'
import { cn } from '@/shared/lib/utils'

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

type NftCarouselProps = {
  title: string
  titleId: string
  label: string
  items: NftSummary[]
  isPending: boolean
}

export function NftCarousel({ title, titleId, label, items, isPending }: NftCarouselProps) {
  const { trackRef, page, pages, goTo } = usePagedScroll(items.length)

  if (!isPending && items.length === 0) return null

  return (
    <section aria-labelledby={titleId} className="space-y-5">
      <h2 id={titleId} className="border-b border-foreground/10 pb-2 text-[15px] font-bold text-highlight">
        {title}
      </h2>

      <ul
        ref={trackRef}
        aria-label={label}
        aria-busy={isPending}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isPending
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
