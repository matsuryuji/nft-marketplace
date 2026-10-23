import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { HeroSlide } from '@/shared/contracts/home'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'

const SWIPE_THRESHOLD = 40

const shellClass =
  'relative isolate overflow-hidden rounded-2xl bg-surface p-4 md:overflow-visible md:rounded-none md:bg-transparent md:p-0'
const gridClass =
  'grid grid-cols-[minmax(0,1fr)_42%] items-center gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]'
const imageFrameClass = 'relative aspect-[4/5] md:aspect-square'

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const pointerStart = useRef<number | null>(null)
  const count = slides.length
  const slide = slides[activeIndex] ?? slides[0]

  if (!slide) return null

  const goTo = (index: number) => setActiveIndex(((index % count) + count) % count)

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') goTo(activeIndex + 1)
    if (event.key === 'ArrowLeft') goTo(activeIndex - 1)
  }

  function handlePointerUp(event: PointerEvent) {
    if (pointerStart.current === null) return
    const delta = event.clientX - pointerStart.current
    pointerStart.current = null
    if (Math.abs(delta) > SWIPE_THRESHOLD) goTo(activeIndex + (delta < 0 ? 1 : -1))
  }

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques"
      className={shellClass}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => (pointerStart.current = event.clientX)}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => (pointerStart.current = null)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 left-1/3 -z-10 size-72 rounded-full bg-primary/35 blur-3xl md:hidden"
      />

      <div
        key={slide.id}
        role="group"
        aria-roledescription="slide"
        aria-label={`${activeIndex + 1} de ${count}`}
        className={cn(gridClass, 'animate-in fade-in duration-500')}
      >
        <div className="space-y-3 md:space-y-5">
          <p className="text-xs text-muted-foreground md:text-sm">{slide.eyebrow}</p>
          <h1 className="text-lg leading-snug font-bold uppercase md:text-4xl md:leading-tight lg:text-[2.75rem]">
            {slide.title}
          </h1>
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground md:line-clamp-none md:max-w-md">
            {slide.description}
          </p>
          <Link
            to="/nfts/$nftId"
            params={{ nftId: slide.nftId }}
            className="inline-flex items-center gap-2 rounded-md text-xs font-bold text-highlight uppercase md:h-10 md:bg-primary md:px-6 md:text-primary-foreground md:hover:opacity-90"
          >
            {slide.ctaLabel}
            <ArrowRight className="size-4 md:hidden" aria-hidden="true" />
          </Link>
        </div>

        <div className={imageFrameClass}>
          <img
            src={slide.image.url}
            alt={slide.image.alt}
            width={slide.image.width}
            height={slide.image.height}
            fetchPriority={activeIndex === 0 ? 'high' : 'auto'}
            draggable={false}
            className="size-full rounded-xl object-cover md:rounded-2xl"
          />
          {slide.secondaryImage && (
            <img
              src={slide.secondaryImage.url}
              alt={slide.secondaryImage.alt}
              width={slide.secondaryImage.width}
              height={slide.secondaryImage.height}
              loading="lazy"
              draggable={false}
              className="absolute -bottom-2 -left-4 aspect-[4/5] w-1/2 rounded-xl border-2 border-surface object-cover md:hidden"
            />
          )}
        </div>
      </div>

      {count > 1 && (
        <div className="mt-4 flex justify-center gap-2 md:-mt-6 md:w-[calc(100%-24rem)] md:justify-center lg:w-[calc(100%-28rem)]">
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ir para o destaque ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className="flex size-6 items-center justify-center rounded-full"
            >
              <span
                className={cn(
                  'size-2 rounded-full bg-primary transition-all',
                  index === activeIndex ? 'w-4 bg-highlight' : 'opacity-60',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export function HeroCarouselSkeleton() {
  return (
    <div className={shellClass} role="status" aria-label="Carregando destaques">
      <div className={gridClass}>
        <div className="space-y-3 md:space-y-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-14 w-full md:h-28" />
          <Skeleton className="h-12 w-full md:h-16 md:max-w-md" />
          <Skeleton className="h-5 w-24 md:h-10 md:w-36" />
        </div>
        <Skeleton className={cn(imageFrameClass, 'rounded-xl md:rounded-2xl')} />
      </div>
      <div className="mt-4 h-6" />
    </div>
  )
}
