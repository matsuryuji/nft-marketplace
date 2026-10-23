import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { nftDetailQuery } from '@/features/catalog/queries'
import { NftDetailSkeleton } from '@/features/nft-detail/components/nft-detail-skeleton'
import { NftDetailView } from '@/features/nft-detail/components/nft-detail-view'
import { toApiError } from '@/shared/api/errors'
import { NotFoundPage } from '@/shared/components/not-found-page'
import { QueryErrorState } from '@/shared/components/query-error-state'

const detailSearchSchema = z.object({
  edition: z.string().max(64).optional().catch(undefined),
})

export const Route = createFileRoute('/nfts/$nftId')({
  validateSearch: detailSearchSchema,
  staticData: { mobileNav: 'hidden' },
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(nftDetailQuery(params.nftId))
  },
  head: () => ({ meta: [{ title: 'Detalhes do NFT · Kurio' }] }),
  component: NftDetailPage,
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const { edition } = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useQuery(nftDetailQuery(nftId))

  if (query.isPending) return <NftDetailSkeleton />

  if (query.isError) {
    if (toApiError(query.error).code === 'NOT_FOUND') {
      return (
        <NotFoundPage
          title="NFT não encontrado"
          description="Este NFT não existe ou foi removido do catálogo."
        />
      )
    }
    return (
      <section className="mx-auto max-w-xl px-4 py-24">
        <QueryErrorState
          error={query.error}
          title="Não foi possível carregar o NFT"
          onRetry={() => query.refetch()}
          isRetrying={query.isFetching}
        />
      </section>
    )
  }

  return (
    <>
      <title>{`${query.data.name} · Kurio`}</title>
      <NftDetailView
        key={query.data.id}
        nft={query.data}
        requestedEditionId={edition}
        onEditionChange={(editionId) =>
          navigate({ search: { edition: editionId }, replace: true, resetScroll: false })
        }
      />
    </>
  )
}
