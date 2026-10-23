import { useQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { CatalogMobileBar } from '@/features/catalog/components/catalog-mobile-bar'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { nftListQuery } from '@/features/catalog/queries'
import { catalogSearchDefaults, catalogSearchSchema, toNftListParams } from '@/features/catalog/search'
import { HeroCarousel, HeroCarouselSkeleton } from '@/features/home/components/hero-carousel'
import { JournalSection, JournalSkeleton } from '@/features/home/components/journal-section'
import { PromotionsSection, PromotionsSkeleton } from '@/features/home/components/promotions-section'
import { SpotlightCard } from '@/features/home/components/spotlight-card'
import { homeContentQuery } from '@/features/home/queries'
import { QueryErrorState } from '@/shared/components/query-error-state'
import { Skeleton } from '@/shared/ui/skeleton'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(catalogSearchDefaults)] },
  loaderDeps: ({ search }) => ({ params: toNftListParams(search) }),
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(homeContentQuery())
    void context.queryClient.prefetchQuery(nftListQuery(deps.params))
  },
  head: () => ({ meta: [{ title: 'Kurio · Marketplace de NFTs' }] }),
  component: HomePage,
})

function HomePage() {
  const home = useQuery(homeContentQuery())

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-6 pb-12 sm:px-6 md:space-y-16 md:pt-10">
      <CatalogMobileBar />

      {home.isPending ? (
        <HeroCarouselSkeleton />
      ) : home.isError ? (
        <QueryErrorState
          error={home.error}
          title="Não foi possível carregar os destaques"
          onRetry={() => home.refetch()}
          isRetrying={home.isFetching}
        />
      ) : (
        <HeroCarousel slides={home.data.heroSlides} />
      )}

      <CatalogSection
        aside={
          home.isPending ? (
            <Skeleton className="aspect-[3/5] w-full rounded-lg" />
          ) : home.data?.spotlight ? (
            <SpotlightCard spotlight={home.data.spotlight} />
          ) : null
        }
      />

      {home.isPending ? (
        <>
          <PromotionsSkeleton />
          <JournalSkeleton />
        </>
      ) : home.isSuccess ? (
        <>
          <PromotionsSection promotions={home.data.promotions} />
          <JournalSection articles={home.data.articles} />
        </>
      ) : null}
    </div>
  )
}
