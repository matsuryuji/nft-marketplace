import { useQuery } from '@tanstack/react-query'
import type { NftDetail } from '@/shared/contracts/nft'
import { QueryErrorState } from '@/shared/components/query-error-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { nftReviewsQuery } from '../queries'
import { formatRating } from '../rating'
import { RatingStars } from './rating-stars'

export type DetailTab = 'details' | 'reviews'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const shortAddress = (address: string) => `${address.slice(0, 6).toUpperCase().replace('0X', '0x')}...${address.slice(-4).toUpperCase()}`

const triggerClass =
  'h-auto flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-1.5 text-[13px] font-normal text-foreground shadow-none data-[state=active]:border-highlight data-[state=active]:bg-transparent data-[state=active]:text-highlight data-[state=active]:shadow-none dark:data-[state=active]:border-highlight dark:data-[state=active]:bg-transparent'

function DetailsPanel({ nft }: { nft: NftDetail }) {
  const blocks = [
    { title: 'Rede:', text: nft.provenance },
    {
      title: 'Contrato:',
      text: `${shortAddress(nft.contractAddress)} • Contrato inteligente ${nft.tokenStandard} verificado.`,
    },
    {
      title: 'Direitos autorais:',
      text: `Direitos autorais do criador: ${nft.royaltiesPercent}% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.`,
    },
  ]
  return (
    <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
      <div className="space-y-4">
        {nft.story.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>
      <dl className="space-y-3">
        {blocks.map((block) => (
          <div key={block.title}>
            <dt className="font-bold text-foreground">{block.title}</dt>
            <dd className="break-words">{block.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ReviewsPanel({ nftId }: { nftId: string }) {
  const query = useQuery(nftReviewsQuery(nftId))

  if (query.isPending) {
    return (
      <div className="space-y-3" role="status" aria-label="Carregando avaliações">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-16 w-full" />
        ))}
      </div>
    )
  }
  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        title="Não foi possível carregar as avaliações"
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  }
  if (query.data.items.length === 0) {
    return <p className="text-xs text-muted-foreground">Este NFT ainda não recebeu avaliações.</p>
  }

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-xs">
        <RatingStars average={query.data.average} />
        <span>
          {formatRating(query.data.average)} de 5 · {query.data.count} avaliações
        </span>
      </p>
      <ul className="divide-y divide-foreground/10">
        {query.data.items.map((review) => (
          <li key={review.id} className="space-y-1 py-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-bold">{review.author}</span>
              <RatingStars average={review.rating} />
              <span className="sr-only">{review.rating} de 5 estrelas</span>
              <time dateTime={review.createdAt} className="text-muted-foreground">
                {dateFormatter.format(new Date(review.createdAt))}
              </time>
            </div>
            <p className="text-muted-foreground">{review.comment}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

type NftDetailTabsProps = {
  nft: NftDetail
  value: DetailTab
  onValueChange: (value: DetailTab) => void
}

export function NftDetailTabs({ nft, value, onValueChange }: NftDetailTabsProps) {
  return (
    <Tabs
      id="nft-detail-tabs"
      value={value}
      onValueChange={(next) => onValueChange(next as DetailTab)}
      className="scroll-mt-20 gap-3"
    >
      <TabsList
        variant="line"
        className="h-auto w-full max-w-full justify-start gap-4 overflow-x-auto border-b border-foreground/10 p-0 [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        <TabsTrigger value="details" className={triggerClass}>
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger value="reviews" className={triggerClass}>
          Avaliações de colecionadores ({nft.rating.count})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        <DetailsPanel nft={nft} />
      </TabsContent>
      <TabsContent value="reviews">
        <ReviewsPanel nftId={nft.id} />
      </TabsContent>
    </Tabs>
  )
}
