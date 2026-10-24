import { Link } from '@tanstack/react-router'
import { Gem, Loader2 } from 'lucide-react'
import { QueryErrorState } from '@/shared/components/query-error-state'
import type { CollectionItem } from '@/shared/contracts/collection'
import { formatEth } from '@/shared/lib/eth'
import { Skeleton } from '@/shared/ui/skeleton'
import { useCollection } from '../queries'

const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3'
const networkNames = { ethereum: 'Ethereum', polygon: 'Polygon' } as const
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })

function CollectionCard({ item }: { item: CollectionItem }) {
  return (
    <article className="flex flex-col gap-3">
      <div className="relative rounded-lg bg-surface p-2">
        <img
          src={item.image.url}
          alt={item.image.alt}
          width={item.image.width}
          height={item.image.height}
          loading="lazy"
          className="aspect-square w-full rounded-md object-cover"
        />
        <span className="absolute top-3 right-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-bold text-highlight backdrop-blur">
          <span className="sr-only">Quantidade: </span>x {item.quantity}
        </span>
      </div>
      <div className="min-w-0 space-y-1 px-1">
        <h2 className="truncate text-sm font-bold">
          <Link to="/nfts/$nftId" params={{ nftId: item.nftId }} search={{ edition: item.editionId }} className="hover:text-highlight">
            {item.name}
          </Link>
        </h2>
        <p className="truncate text-xs text-muted-foreground">
          Edição {item.editionLabel} · {networkNames[item.network]}
        </p>
        <p className="text-xs text-muted-foreground">
          Adquirido em <time dateTime={item.lastAcquiredAt}>{dateFormatter.format(new Date(item.lastAcquiredAt))}</time>
        </p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-bold text-highlight">
            <span className="sr-only">Total pago: </span>
            {formatEth(item.totalPaid, 4)}
          </span>
          <Link
            to="/orders/$orderId"
            params={{ orderId: item.lastOrderId }}
            className="text-xs text-primary hover:underline"
            aria-label={`Ver recibo da compra de ${item.name}`}
          >
            Ver recibo
          </Link>
        </div>
      </div>
    </article>
  )
}

function CollectionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg bg-surface p-2">
        <Skeleton className="aspect-square rounded-md" />
      </div>
      <div className="space-y-2 px-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

export function CollectionPage() {
  const query = useCollection()
  const total = query.data?.totalQuantity ?? 0
  const pending = query.data?.pendingOrders ?? 0

  return (
    <section aria-labelledby="collection-title" className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <h1 id="collection-title" className="text-[15px] font-bold">
          Minha coleção
        </h1>
        {query.isSuccess && (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {total} {total === 1 ? 'NFT adquirido' : 'NFTs adquiridos'}
          </p>
        )}
      </div>

      {pending > 0 && (
        <p role="status" className="flex items-center gap-2 rounded-[3px] border border-primary/40 bg-primary/10 px-3 py-2 text-xs">
          <Loader2 className="size-3.5 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
          {pending === 1 ? '1 compra aguardando confirmação na rede.' : `${pending} compras aguardando confirmação na rede.`}
        </p>
      )}

      {query.isPending ? (
        <div className={gridClass} role="status" aria-label="Carregando coleção">
          {Array.from({ length: 6 }, (_, index) => (
            <CollectionSkeleton key={index} />
          ))}
        </div>
      ) : query.isError ? (
        <QueryErrorState error={query.error} title="Não foi possível carregar sua coleção" onRetry={() => query.refetch()} isRetrying={query.isFetching} />
      ) : query.data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[3px] bg-surface px-6 py-12 text-center">
          <Gem className="size-8 text-primary" aria-hidden="true" />
          <p className="font-bold">Você ainda não adquiriu nenhum NFT</p>
          <p className="text-xs text-muted-foreground">Os NFTs das compras confirmadas aparecem aqui.</p>
          <Link to="/" hash="catalog" className="mt-2 rounded-[4px] bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90">
            Explorar NFTs
          </Link>
        </div>
      ) : (
        <ul className={gridClass}>
          {query.data.items.map((item) => (
            <li key={item.editionId}>
              <CollectionCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
