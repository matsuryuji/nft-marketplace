import { useState } from 'react'
import { CouponForm } from '@/features/cart/components/coupon-form'
import { useCart } from '@/features/cart/queries'
import type { Quote } from '@/shared/contracts/checkout'
import { formatEth, formatEthAmount } from '@/shared/lib/eth'
import { Skeleton } from '@/shared/ui/skeleton'

const rowClass = 'flex items-baseline justify-between gap-3 text-[13px]'

export function OrderReview({ quote, isRefreshing }: { quote: Quote; isRefreshing: boolean }) {
  const cart = useCart()
  const [couponOpen, setCouponOpen] = useState(false)

  return (
    <section aria-labelledby="order-review-title" className="space-y-3" aria-busy={isRefreshing}>
      <h2 id="order-review-title" className="text-[15px] font-bold">
        Seus NFTs
      </h2>
      <div className="flex justify-between border-b border-primary pb-2 text-[13px] font-bold" aria-hidden="true">
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>
      <ul className="space-y-2">
        {quote.items.map((item) => (
          <li key={item.editionId} className="flex items-center gap-3 rounded-[3px] bg-surface p-1.5 pr-3">
            <img src={item.image.url} alt="" width={item.image.width} height={item.image.height} className="size-14 shrink-0 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold">{item.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">ID do token: {item.tokenId}</p>
              <p className="truncate text-[11px] text-muted-foreground">Edição {item.editionLabel}</p>
            </div>
            <span className="text-xs text-muted-foreground">
              <span className="sr-only">Quantidade: </span>(x {item.quantity})
            </span>
            <span className="text-sm font-bold whitespace-nowrap text-highlight">{formatEth(item.lineTotal, 4)}</span>
          </li>
        ))}
      </ul>

      <div className="pt-1 text-center text-xs">
        {couponOpen && cart.data ? (
          <div className="text-left">
            <CouponForm cart={cart.data} />
          </div>
        ) : quote.coupon ? (
          <p className="text-muted-foreground">
            Cupom <span className="font-bold text-highlight">{quote.coupon.code}</span> aplicado ·{' '}
            <button type="button" onClick={() => setCouponOpen(true)} className="underline-offset-2 hover:underline">
              alterar
            </button>
          </p>
        ) : (
          <button type="button" onClick={() => setCouponOpen(true)} className="hover:text-highlight">
            Tem um código promocional? Aplique aqui
          </button>
        )}
      </div>

      <dl className="space-y-2">
        <div className={rowClass}>
          <dt>Subtotal</dt>
          <dd className="text-sm tabular-nums">{formatEth(quote.summary.subtotal, 6)}</dd>
        </div>
        <div className={rowClass}>
          <dt>Desconto do lançamento</dt>
          <dd className="text-xs tabular-nums">(-) {formatEthAmount(quote.summary.discount, 6)}</dd>
        </div>
        <div className={rowClass}>
          <dt>Taxa de rede</dt>
          <dd className="text-right text-sm tabular-nums">
            {formatEth(quote.summary.networkFee, 6)}
            <span className="block text-[10px] text-highlight">Taxa estimada</span>
          </dd>
        </div>
        <div className="flex items-baseline justify-around gap-3 border-t border-primary pt-3 font-bold">
          <dt className="text-[13px]">Total</dt>
          <dd className="text-base text-highlight tabular-nums" aria-live="polite" aria-atomic="true">
            {formatEth(quote.summary.total, 6)}
          </dd>
        </div>
      </dl>
    </section>
  )
}

export function OrderReviewSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Calculando cotação">
      <Skeleton className="h-5 w-24" />
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} className="h-[68px] w-full rounded-[3px]" />
      ))}
      {[0, 1, 2].map((key) => (
        <div key={`row-${key}`} className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
      <Skeleton className="h-6 w-full" />
    </div>
  )
}
