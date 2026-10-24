import { Link, useRouter } from '@tanstack/react-router'
import { ChevronLeft, ShoppingBag } from 'lucide-react'
import { QueryErrorState } from '@/shared/components/query-error-state'
import { cn } from '@/shared/lib/utils'
import { desktopGrid } from '../layout'
import { useAcknowledgePrices, useCart, useRemoveCartItem, useUpdateCartItem } from '../queries'
import { CartItemRow, CartItemSkeleton } from './cart-item'
import { CartRecommendations } from './cart-recommendations'
import { CartSummary, CartSummarySkeleton } from './cart-summary'

function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface px-6 py-12 text-center md:rounded-[3px]">
      <ShoppingBag className="size-8 text-primary" aria-hidden="true" />
      <p className="font-bold">Seu carrinho está vazio</p>
      <p className="text-xs text-muted-foreground">Explore o catálogo e adicione edições ao carrinho.</p>
      <Link
        to="/"
        hash="catalog"
        className="mt-2 inline-flex h-9 items-center rounded-[4px] bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90"
      >
        Explorar NFTs
      </Link>
    </div>
  )
}

export function CartPage() {
  const router = useRouter()
  const query = useCart()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const acknowledge = useAcknowledgePrices()
  const cart = query.data
  const hasPriceChanges = cart?.items.some((item) => item.issues.includes('price_changed')) ?? false
  const isSyncing = query.isFetching || updateItem.isPending || removeItem.isPending

  const goBack = () => {
    if (window.history.length > 1) router.history.back()
    else void router.navigate({ to: '/' })
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 sm:px-6 md:pt-6 md:pb-16">
      <nav aria-label="Trilha de navegação" className="mb-3 hidden text-xs font-bold md:block">
        <ol className="flex items-center gap-1">
          <li>
            <Link to="/" className="hover:text-highlight">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/" hash="catalog" className="hover:text-highlight">
              Mercado
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Carrinho</li>
        </ol>
      </nav>

      <div className="relative mb-4 flex items-center justify-center md:hidden">
        <button
          type="button"
          onClick={goBack}
          aria-label="Voltar"
          className="absolute left-0 flex size-9 items-center justify-center rounded-full bg-surface text-primary"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <h1 className="text-lg font-bold">Carrinho de NFTs</h1>
      </div>
      <h1 className="sr-only max-md:hidden">Carrinho</h1>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_15rem] md:gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12">
        <section aria-label="Itens do carrinho" className="min-w-0 space-y-2">
          <div className={cn('mb-3 hidden border-b border-primary pb-2 text-xs font-bold', desktopGrid)} aria-hidden="true">
            <span>NFTs</span>
            <span>Preço</span>
            <span>Edições</span>
            <span>Total</span>
            <span />
          </div>

          {hasPriceChanges && (
            <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-[3px] border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
              <span>Alguns preços mudaram desde que você adicionou os itens. O resumo já usa os valores atuais.</span>
              <button
                type="button"
                onClick={() => acknowledge.mutate()}
                disabled={acknowledge.isPending}
                className="font-bold text-highlight hover:underline disabled:opacity-50"
              >
                Entendi
              </button>
            </div>
          )}

          {query.isPending ? (
            <ul className="space-y-2" aria-busy="true" aria-label="Carregando itens">
              {[0, 1, 2].map((key) => (
                <CartItemSkeleton key={key} />
              ))}
            </ul>
          ) : query.isError ? (
            <QueryErrorState
              error={query.error}
              title="Não foi possível carregar o carrinho"
              onRetry={() => query.refetch()}
              isRetrying={query.isFetching}
            />
          ) : cart && cart.items.length > 0 ? (
            <ul className="space-y-3 md:space-y-2">
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onQuantityChange={(quantity) => updateItem.mutate({ itemId: item.id, quantity })}
                  onRemove={() => removeItem.mutate(item.id)}
                />
              ))}
            </ul>
          ) : (
            <EmptyCart />
          )}
        </section>

        <div className="-mx-4 sm:-mx-6 md:mx-0">
          {query.isPending ? (
            <CartSummarySkeleton />
          ) : cart && !query.isError ? (
            <CartSummary cart={cart} isSyncing={isSyncing} />
          ) : null}
        </div>
      </div>

      <div className="mt-14 md:mt-20">
        <CartRecommendations excludeIds={cart?.items.map((item) => item.nft.id) ?? []} />
      </div>
    </div>
  )
}
