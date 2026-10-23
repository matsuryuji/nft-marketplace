import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { Promotion } from '@/shared/contracts/home'
import { Skeleton } from '@/shared/ui/skeleton'

export function PromotionsSection({ promotions }: { promotions: Promotion[] }) {
  if (promotions.length === 0) return null
  return (
    <section aria-label="Lançamentos e coleções" className="grid gap-6 lg:grid-cols-2">
      {promotions.map((promotion) => (
        <article key={promotion.id} className="grid grid-cols-2 overflow-hidden rounded-lg bg-surface">
          <img
            src={promotion.image.url}
            alt={promotion.image.alt}
            width={promotion.image.width}
            height={promotion.image.height}
            loading="lazy"
            className="aspect-[6/5] size-full rounded-lg object-cover"
          />
          <div className="flex flex-col items-end justify-center gap-3 p-4 text-right sm:p-6">
            <h2 className="text-sm leading-snug font-bold sm:text-base">{promotion.title}</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{promotion.description}</p>
            <Link
              to="/"
              search={{ ...promotion.catalogLink }}
              hash="catalogo"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground hover:opacity-90"
            >
              {promotion.ctaLabel}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}

export function PromotionsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2" role="status" aria-label="Carregando lançamentos">
      {[0, 1].map((key) => (
        <Skeleton key={key} className="aspect-[12/5] rounded-lg" />
      ))}
    </div>
  )
}
