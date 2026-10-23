import { Star } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const STAR_COUNT = 5

export function RatingStars({ average, className }: { average: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-hidden="true">
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const fill = Math.min(Math.max(average - index, 0), 1)
        return (
          <span key={index} className="relative inline-block size-3">
            <Star className="absolute inset-0 size-3 fill-foreground text-foreground" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="size-3 fill-primary text-primary" />
            </span>
          </span>
        )
      })}
    </span>
  )
}
