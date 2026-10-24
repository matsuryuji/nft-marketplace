import { Link } from '@tanstack/react-router'
import type { Cart } from '@/shared/contracts/cart'
import { formatEth, formatEthAmount } from '@/shared/lib/eth'
import { cn } from '@/shared/lib/utils'
import { useMobileBarHeight } from '@/shared/hooks/use-mobile-bar-height'
import { Skeleton } from '@/shared/ui/skeleton'
import { CouponForm } from './coupon-form'

type CartSummaryProps = {
  cart: Cart
  isSyncing: boolean
}

const rowClass = 'flex items-baseline justify-between gap-3 text-sm md:text-xs'

const shellClass = cn(
  'fixed inset-x-0 bottom-0 z-40 max-h-[75dvh] space-y-3 overflow-y-auto rounded-t-[28px] border-t border-surface-strong bg-surface px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(0,0,0,0.45)]',
  'md:static md:z-auto md:max-h-none md:space-y-4 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none',
)

export function CartSummary({ cart, isSyncing }: CartSummaryProps) {
  const barRef = useMobileBarHeight<HTMLElement>()
  const { summary } = cart
  const blockedReason = cart.items.length === 0
    ? 'Adicione itens para finalizar.'
    : !cart.canCheckout
      ? 'Resolva os itens indisponíveis para continuar.'
      : null

  return (
    <section ref={barRef} aria-labelledby="cart-summary-title" className={shellClass}>
      <h2
        id="cart-summary-title"
        className="sr-only text-sm font-bold md:not-sr-only md:mb-6 md:block md:border-b md:border-primary md:pb-3"
      >
        Resumo da carteira
      </h2>

      <CouponForm cart={cart} />

      <dl className={cn('space-y-1.5 transition-opacity md:space-y-2', isSyncing && 'opacity-60')} aria-busy={isSyncing}>
        <div className={rowClass}>
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatEth(summary.subtotal, 6)}</dd>
        </div>
        <div className={rowClass}>
          <dt>Desconto do lançamento</dt>
          <dd className="tabular-nums">(-) {formatEthAmount(summary.discount, 6)}</dd>
        </div>
        <div className={rowClass}>
          <dt>Taxa de rede</dt>
          <dd className="text-right tabular-nums">
            {formatEth(summary.networkFee, 6)}
            <span className="block text-[10px] text-highlight">Taxa estimada</span>
          </dd>
        </div>
        <div className={cn(rowClass, 'border-t border-foreground/10 pt-2 font-bold md:mt-4 md:pt-3')}>
          <dt className="text-base md:text-sm">Total</dt>
          <dd className="text-lg text-highlight tabular-nums md:text-base" aria-live="polite" aria-atomic="true">
            {formatEth(summary.total, 6)}
          </dd>
        </div>
      </dl>

      <div className="space-y-2 md:space-y-3">
        {blockedReason ? (
          <button
            type="button"
            disabled
            aria-describedby="checkout-blocked-reason"
            className="h-12 w-full rounded-full bg-primary text-base font-bold text-primary-foreground opacity-50 md:h-9 md:rounded-[3px] md:text-sm"
          >
            Conectar e finalizar
          </button>
        ) : (
          <Link
            to="/checkout"
            className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-primary to-[#b8733c] text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 md:h-9 md:rounded-[3px] md:bg-none md:bg-primary md:text-sm"
          >
            Conectar e finalizar
          </Link>
        )}
        {blockedReason && (
          <p id="checkout-blocked-reason" className="text-center text-[11px] text-muted-foreground">
            {blockedReason}
          </p>
        )}
        <Link
          to="/"
          hash="catalogo"
          className="hidden text-center text-primary hover:underline md:block md:text-xs"
        >
          Continuar explorando
        </Link>
      </div>
    </section>
  )
}

export function CartSummarySkeleton() {
  const barRef = useMobileBarHeight<HTMLDivElement>()
  return (
    <div ref={barRef} className={shellClass} role="status" aria-label="Carregando resumo">
      <Skeleton className="hidden h-5 w-40 md:block" />
      <Skeleton className="h-10 w-full rounded-full md:h-8 md:rounded-[3px]" />
      {[0, 1, 2].map((key) => (
        <div key={key} className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-12 w-full rounded-full md:h-9 md:rounded-[3px]" />
    </div>
  )
}
