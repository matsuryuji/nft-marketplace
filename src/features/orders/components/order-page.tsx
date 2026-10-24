import { useEffect, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { Loader2, X, XCircle } from 'lucide-react'
import { useSession } from '@/features/auth/session'
import { cartKey } from '@/features/cart/queries'
import { useOrder } from '@/features/checkout/queries'
import { toApiError } from '@/shared/api/errors'
import { NotFoundPage } from '@/shared/components/not-found-page'
import { QueryErrorState } from '@/shared/components/query-error-state'
import type { Order } from '@/shared/contracts/checkout'
import { walletProviderLabels } from '@/shared/contracts/wallet'
import { formatEth } from '@/shared/lib/eth'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'
import { ThankYouIcon } from './thank-you-icon'

const networkNames = { ethereum: 'Ethereum', polygon: 'Polygon' } as const
const explorerNames = { ethereum: 'Etherscan', polygon: 'Polygonscan' } as const

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' })

function formatOrderDate(iso: string) {
  const date = new Date(iso)
  const month = monthFormatter.format(date).replace('.', '')
  return `${date.getDate()} ${month.charAt(0).toUpperCase()}${month.slice(1)}, ${date.getFullYear()}`
}

const shortHash = (hash: string) => `${hash.slice(0, 6)}…${hash.slice(-4)}`

const cardClass =
  'relative mx-auto w-full max-w-[36rem] overflow-hidden rounded-[3px] border-b-[6px] border-primary bg-surface shadow-2xl'

function CloseButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => void router.navigate({ to: '/' })}
      aria-label="Fechar e voltar ao início"
      className="absolute top-4 right-4 rounded-sm p-1 text-primary transition-colors hover:text-highlight"
    >
      <X className="size-4" aria-hidden="true" />
    </button>
  )
}

function InfoStrip({ order }: { order: Order }) {
  const items: { label: string; value: ReactNode; strong?: boolean }[] = [
    {
      label: 'ID da transação',
      value: order.transactionHash ? (
        <span title={order.transactionHash}>{shortHash(order.transactionHash)}</span>
      ) : (
        <span className="text-muted-foreground">{order.status === 'refused' ? 'Não gerada' : 'Aguardando'}</span>
      ),
      strong: true,
    },
    { label: 'Data', value: formatOrderDate(order.createdAt) },
    { label: 'Total', value: formatEth(order.summary.total, 6) },
    { label: 'Carteira', value: walletProviderLabels[order.wallet.provider], strong: true },
  ]
  return (
    <dl className="grid grid-cols-2 gap-y-3 border-y border-primary px-5 py-3 sm:grid-cols-4 sm:gap-y-0 sm:px-8">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn('min-w-0 px-2 text-[11px] sm:px-3', index > 0 && 'sm:border-l sm:border-foreground/30', index === 0 && 'sm:pl-0')}
        >
          <dt className={cn('truncate', item.strong ? 'font-bold' : 'text-foreground/80')}>{item.label}</dt>
          <dd className="truncate text-muted-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function TransactionDetails({ order }: { order: Order }) {
  return (
    <section aria-labelledby="transaction-details-title" className="px-5 pt-5 sm:px-10">
      <h2 id="transaction-details-title" className="mb-2 text-xs font-bold">
        Detalhes da transação
      </h2>
      <div className="grid grid-cols-[minmax(0,1fr)_4rem_5rem] border-b border-primary pb-1.5 text-xs font-bold" aria-hidden="true">
        <span>NFTs</span>
        <span className="text-center">Edições</span>
        <span className="text-right">Subtotal</span>
      </div>
      <ul className="divide-y divide-transparent">
        {order.items.map((item) => (
          <li key={item.editionId} className="grid grid-cols-[minmax(0,1fr)_4rem_5rem] items-center gap-y-1 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <img src={item.image.url} alt="" width={item.image.width} height={item.image.height} className="size-10 shrink-0 rounded-md object-cover" />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{item.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">ID do token: {item.tokenId}</p>
              </div>
            </div>
            <span className="text-center text-[10px] text-muted-foreground">
              <span className="sr-only">Quantidade: </span>(x {item.quantity})
            </span>
            <span className="text-right text-sm font-bold whitespace-nowrap text-highlight">{formatEth(item.lineTotal, 4)}</span>
          </li>
        ))}
      </ul>
      <dl className="ml-auto max-w-[15rem] space-y-1 pt-1 pb-3 text-xs">
        {Number(order.summary.discount) > 0 && (
          <div className="flex justify-between">
            <dt>Desconto{order.coupon ? ` (${order.coupon.code})` : ''}</dt>
            <dd>(-) {formatEth(order.summary.discount, 6)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Taxa de rede</dt>
          <dd className="text-sm">{formatEth(order.summary.networkFee, 6)}</dd>
        </div>
        <div className="flex justify-between font-bold">
          <dt>Total</dt>
          <dd className="text-sm text-highlight">{formatEth(order.summary.total, 6)}</dd>
        </div>
      </dl>
    </section>
  )
}

function OrderCard({ order }: { order: Order }) {
  const network = networkNames[order.wallet.network]

  const header =
    order.status === 'confirmed' ? (
      <>
        <ThankYouIcon className="h-12 w-11 text-primary" />
        <h1 className="text-sm font-bold text-muted-foreground">Seus NFTs agora estão na sua carteira</h1>
      </>
    ) : order.status === 'pending' ? (
      <>
        <Loader2 className="size-10 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
        <h1 className="text-sm font-bold text-muted-foreground">Confirmando sua compra na rede…</h1>
      </>
    ) : (
      <>
        <XCircle className="size-10 text-destructive" aria-hidden="true" />
        <h1 className="text-sm font-bold text-foreground">Pagamento recusado</h1>
      </>
    )

  const message =
    order.status === 'confirmed'
      ? `Transação confirmada na ${network}. A propriedade foi transferida para sua carteira conectada e registrada na rede.`
      : order.status === 'pending'
        ? 'Aguardando a confirmação da transação. Você pode recarregar ou fechar esta página: o pedido continua sendo processado e não será cobrado duas vezes.'
        : order.failureReason

  return (
    <article className={cardClass} aria-labelledby="order-status-title">
      <CloseButton />
      <header
        id="order-status-title"
        className="flex flex-col items-center gap-3 px-6 pt-8 pb-4 text-center"
        role={order.status === 'refused' ? 'alert' : 'status'}
        aria-live="polite"
      >
        {header}
      </header>
      <InfoStrip order={order} />
      <TransactionDetails order={order} />
      <footer className="mx-5 space-y-4 border-t border-foreground/10 pt-4 pb-8 text-center sm:mx-10">
        <p className="mx-auto max-w-sm text-[11px] leading-relaxed text-muted-foreground">{message}</p>
        {order.status === 'confirmed' && order.explorerUrl && (
          <a
            href={order.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Link simulado para o explorador da rede de testes"
            className="inline-flex h-9 items-center rounded-[3px] bg-primary px-4 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ver no {explorerNames[order.wallet.network]}
            <span className="sr-only"> (link simulado, abre em nova aba)</span>
          </a>
        )}
        {order.status === 'refused' && (
          <Link
            to="/cart"
            className="inline-flex h-9 items-center rounded-[3px] bg-primary px-4 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Voltar ao carrinho
          </Link>
        )}
      </footer>
    </article>
  )
}

function OrderCardSkeleton() {
  return (
    <div className={cardClass} role="status" aria-label="Carregando pedido">
      <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4">
        <Skeleton className="size-12 rounded-md" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-14 w-full rounded-none" />
      <div className="space-y-3 px-10 py-5">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-10 w-full" />
        ))}
        <Skeleton className="ml-auto h-8 w-40" />
      </div>
    </div>
  )
}

export function OrderPage({ orderId }: { orderId: string }) {
  const query = useOrder(orderId)
  const queryClient = useQueryClient()
  const { user } = useSession()
  const status = query.data?.status

  useEffect(() => {
    if (status && status !== 'pending' && user) void queryClient.invalidateQueries({ queryKey: cartKey(user.id) })
  }, [status, user, queryClient])

  if (query.isError) {
    const error = toApiError(query.error)
    if (error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN') {
      return <NotFoundPage title="Pedido não encontrado" description="Este pedido não existe ou pertence a outra conta." />
    }
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <QueryErrorState error={query.error} title="Não foi possível carregar o pedido" onRetry={() => query.refetch()} isRetrying={query.isFetching} />
      </div>
    )
  }

  return (
    <div className="px-4 py-12 md:py-20">{query.isPending ? <OrderCardSkeleton /> : <OrderCard order={query.data} />}</div>
  )
}
