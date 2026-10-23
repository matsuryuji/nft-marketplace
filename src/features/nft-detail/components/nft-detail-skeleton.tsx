import { Skeleton } from '@/shared/ui/skeleton'

export function NftDetailSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 sm:px-6 md:pt-6 md:pb-16"
      role="status"
      aria-label="Carregando NFT"
    >
      <Skeleton className="mb-3 hidden h-4 w-28 md:block" />
      <div className="grid gap-5 rounded-[28px] bg-surface p-4 md:grid-cols-2 md:gap-8 md:rounded-none md:bg-transparent md:p-0 lg:gap-6">
        <div className="flex gap-3 lg:gap-4">
          <div className="hidden w-[5.5rem] shrink-0 flex-col gap-3 md:flex lg:w-24">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
          <div className="flex-1 md:rounded-[3px] md:bg-surface md:p-4">
            <Skeleton className="aspect-square w-full rounded-2xl md:aspect-[4/4.15] md:rounded-xl" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="hidden h-7 w-full md:block" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="hidden h-10 w-full md:block" />
          <Skeleton className="h-16 w-1/2" />
        </div>
      </div>
    </div>
  )
}
