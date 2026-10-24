import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { ChevronLeft, Plus, RefreshCw, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/features/auth/session'
import { useCart } from '@/features/cart/queries'
import { realtimeBus } from '@/features/realtime/bus'
import { useDisconnectWallet, useUpsertWallet, useWallets, useWalletSession } from '@/features/wallets/queries'
import { toApiError } from '@/shared/api/errors'
import { QueryErrorState } from '@/shared/components/query-error-state'
import type { WalletProvider, WalletSlot } from '@/shared/contracts/wallet'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { useMobileBarHeight } from '@/shared/hooks/use-mobile-bar-height'
import { formatEth } from '@/shared/lib/eth'
import { cn } from '@/shared/lib/utils'
import { RadioDot } from '@/shared/ui/radio-dot'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet'
import { Skeleton } from '@/shared/ui/skeleton'
import { buyerDefaults, checkoutFormSchema, walletDefaults, type CheckoutFormOutput, type CheckoutFormValues } from '../form'
import { checkoutKeys, useQuote } from '../queries'
import { usePlaceOrder } from '../use-place-order'
import { CheckoutFields } from './checkout-fields'
import { OrderReview, OrderReviewSkeleton } from './order-review'
import { PlaceOrderDialog } from './place-order-dialog'
import { ProviderOptions } from './provider-options'
import { WalletOptionCard } from './wallet-option-card'

const otherSlot = (slot: WalletSlot): WalletSlot => (slot === 'primary' ? 'secondary' : 'primary')
const confirmClass =
  'h-11 w-full rounded-full bg-gradient-to-r from-primary to-[#b8733c] text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 md:h-9 md:rounded-[4px] md:bg-none md:bg-primary md:text-sm'

export function CheckoutPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const isDesktop = useMediaQuery('(min-width: 48rem)')
  const wallets = useWallets()
  const walletSession = useWalletSession()
  const disconnect = useDisconnectWallet()
  const upsertWallet = useUpsertWallet()
  const quote = useQuote()
  const cart = useCart()
  const flow = usePlaceOrder()
  const barRef = useMobileBarHeight<HTMLDivElement>()
  const [slot, setSlot] = useState<WalletSlot | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [staleReason, setStaleReason] = useState<string | null>(null)
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null)
  const busyRef = useRef(false)
  busyRef.current = flow.isBusy
  const quoteItemsRef = useRef<string[]>([])
  quoteItemsRef.current = quote.data?.items.map((item) => item.nftId) ?? []

  useEffect(
    () =>
      realtimeBus.subscribe((signal) => {
        if (busyRef.current) return
        if (signal.kind === 'reconnected') {
          setStaleReason('A conexão em tempo real foi restabelecida. Atualize a cotação para confirmar os valores atuais.')
          return
        }
        if (signal.event.type !== 'nft.updated' || !quoteItemsRef.current.includes(signal.event.data.nftId)) return
        setRefreshNotice(null)
        setStaleReason(`${signal.event.data.name} teve preço ou disponibilidade alterados. Atualize a cotação para continuar.`)
      }),
    [],
  )

  const refreshQuote = async () => {
    const previousTotal = quote.data?.summary.total
    const result = await quote.refetch()
    if (!result.data) return
    setStaleReason(null)
    setRefreshNotice(
      previousTotal && previousTotal !== result.data.summary.total
        ? `Cotação atualizada. Novo total: ${formatEth(result.data.summary.total, 6)} (antes ${formatEth(previousTotal, 6)}).`
        : 'Cotação atualizada. O total não mudou.',
    )
  }

  const form = useForm<CheckoutFormValues, unknown, CheckoutFormOutput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { buyer: buyerDefaults(user), wallet: walletDefaults(null, 'primary') },
    mode: 'onTouched',
  })

  const activeSlot = slot ?? 'primary'
  const savedWallet = wallets.data?.[activeSlot] ?? null

  const selectSlot = (next: WalletSlot) => {
    setSlot(next)
    form.reset({ buyer: form.getValues('buyer'), wallet: walletDefaults(wallets.data?.[next] ?? null, next) }, { keepDirty: false })
  }

  useEffect(() => {
    if (slot || !wallets.data || walletSession.isPending) return
    const sessionSlot =
      walletSession.data && wallets.data.primary?.id === walletSession.data.walletId
        ? 'primary'
        : walletSession.data && wallets.data.secondary?.id === walletSession.data.walletId
          ? 'secondary'
          : null
    const initial: WalletSlot = sessionSlot ?? (wallets.data.primary || !wallets.data.secondary ? 'primary' : 'secondary')
    setSlot(initial)
    form.reset({ buyer: form.getValues('buyer'), wallet: walletDefaults(wallets.data[initial], initial) })
  }, [slot, wallets.data, walletSession.isPending, walletSession.data, form])

  const cartVersion = cart.data?.version
  const lastCartVersion = useRef(cartVersion)
  useEffect(() => {
    if (cartVersion === undefined || flow.isBusy) return
    if (lastCartVersion.current !== undefined && lastCartVersion.current !== cartVersion && user) {
      void queryClient.invalidateQueries({ queryKey: checkoutKeys.quote(user.id) })
    }
    lastCartVersion.current = cartVersion
  }, [cartVersion, flow.isBusy, queryClient, user])

  const provider = form.watch('wallet.provider')
  const connectedProvider =
    walletSession.data && savedWallet && walletSession.data.walletId === savedWallet.id ? walletSession.data.provider : null

  const setProvider = (next: WalletProvider) =>
    form.setValue('wallet.provider', next, { shouldDirty: true, shouldValidate: true })

  const submit = form.handleSubmit(
    (values) =>
      flow.placeOrder({
        buyer: values.buyer,
        wallet: values.wallet,
        walletDirty: Boolean(form.formState.dirtyFields.wallet) || !savedWallet,
        slot: activeSlot,
      }),
    () => {
      if (!isDesktop) setEditorOpen(true)
      toast.error('Revise os campos destacados antes de confirmar a compra.', { id: 'checkout-invalid' })
    },
  )

  const saveEditor = async () => {
    const valid = await form.trigger(undefined, { shouldFocus: true })
    if (!valid) return
    if (form.formState.dirtyFields.wallet || !savedWallet) {
      try {
        const values = checkoutFormSchema.parse(form.getValues())
        const updated = await upsertWallet.mutateAsync({ slot: activeSlot, body: values.wallet })
        form.reset({ buyer: form.getValues('buyer'), wallet: walletDefaults(updated[activeSlot], activeSlot) })
        toast.success('Carteira salva.')
      } catch (error) {
        const apiError = toApiError(error)
        if (apiError.fields.address) form.setError('wallet.address', { message: apiError.fields.address }, { shouldFocus: true })
        else toast.error('Não foi possível salvar a carteira', { description: apiError.message })
        return
      }
    }
    setEditorOpen(false)
  }

  const goBack = () => {
    if (window.history.length > 1) router.history.back()
    else void router.navigate({ to: '/cart' })
  }

  const quoteError = quote.isError ? toApiError(quote.error) : null
  const emptyCart = quoteError?.code === 'VALIDATION_ERROR'
  const canConfirm = Boolean(quote.data?.canCheckout) && !flow.isBusy && slot !== null && !staleReason

  const otherWalletToggle = (
    <button
      type="button"
      role="checkbox"
      aria-checked={activeSlot === 'secondary'}
      onClick={() => selectSlot(otherSlot(activeSlot))}
      className="flex items-center gap-2 rounded-md text-[13px]"
    >
      <RadioDot checked={activeSlot === 'secondary'} />
      Usar outra carteira?
      {wallets.data && !wallets.data.secondary && activeSlot === 'primary' && (
        <span className="text-[11px] text-muted-foreground">(cadastrar carteira reserva)</span>
      )}
    </button>
  )

  const providerOptions = (
    <ProviderOptions
      value={provider}
      onChange={setProvider}
      connectedProvider={connectedProvider}
      onDisconnect={() => disconnect.mutate()}
      disconnecting={disconnect.isPending}
      error={form.formState.errors.wallet?.provider?.message}
    />
  )

  if (emptyCart) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
        <ShoppingBag className="size-8 text-primary" aria-hidden="true" />
        <h1 className="text-lg font-bold">Seu carrinho está vazio</h1>
        <p className="text-sm text-muted-foreground">Adicione NFTs ao carrinho para finalizar uma compra.</p>
        <Link to="/" hash="catalogo" className="mt-2 rounded-[4px] bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">
          Explorar NFTs
        </Link>
      </div>
    )
  }

  const walletList = [wallets.data?.secondary, wallets.data?.primary].filter((wallet) => wallet != null)

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto w-full max-w-6xl px-4 pt-4 max-md:pb-[calc(var(--mobile-bar-height,6rem)+1.5rem)] sm:px-6 md:pt-6 md:pb-16"
    >
      <nav aria-label="Trilha de navegação" className="mb-6 hidden text-xs font-bold md:block">
        <ol className="flex items-center gap-1">
          <li>
            <Link to="/" className="hover:text-highlight">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/" hash="catalogo" className="hover:text-highlight">
              Mercado
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Pagamento</li>
        </ol>
      </nav>

      <div className="relative mb-6 flex items-center justify-center md:hidden">
        <button
          type="button"
          onClick={goBack}
          aria-label="Voltar"
          className="absolute left-0 flex size-9 items-center justify-center rounded-full bg-surface text-primary"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <h1 className="text-lg font-bold">Pagamento com carteira</h1>
      </div>
      <h1 className="sr-only max-md:hidden">Pagamento</h1>

      {staleReason && (
        <div
          id="stale-quote-alert"
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-warning/50 bg-warning/10 p-3 text-xs"
        >
          <span>{staleReason}</span>
          <button
            type="button"
            onClick={refreshQuote}
            disabled={quote.isFetching}
            className="inline-flex items-center gap-1.5 rounded-[3px] bg-primary px-3 py-1.5 font-bold text-primary-foreground disabled:opacity-60"
          >
            <RefreshCw className={cn('size-3.5', quote.isFetching && 'animate-spin motion-reduce:animate-none')} aria-hidden="true" />
            {quote.isFetching ? 'Atualizando…' : 'Atualizar cotação'}
          </button>
        </div>
      )}
      {refreshNotice && !staleReason && (
        <p role="status" className="mb-4 rounded-[3px] border border-primary/40 bg-primary/10 p-3 text-xs">
          {refreshNotice}
        </p>
      )}

      {quote.data && !quote.data.canCheckout && (
        <p role="alert" className="mb-4 rounded-[3px] border border-destructive/40 bg-destructive/10 p-3 text-xs">
          Alguns itens não estão mais disponíveis.{' '}
          <Link to="/cart" className="font-bold underline">
            Revise o carrinho
          </Link>{' '}
          para continuar.
        </p>
      )}

      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        <section aria-labelledby="buyer-title" className="hidden md:block">
          <h2 id="buyer-title" className="mb-4 text-[15px] font-bold">
            Perfil do colecionador
          </h2>
          {isDesktop && <CheckoutFields form={form} layout="grid" otherWalletToggle={otherWalletToggle} />}
        </section>

        <div className="space-y-8 md:space-y-6">
          <section aria-labelledby="connected-wallet-title" className="space-y-3 md:hidden">
            <div className="flex items-center justify-between">
              <h2 id="connected-wallet-title" className="text-base font-bold">
                Carteira conectada
              </h2>
              <button
                type="button"
                onClick={() => {
                  selectSlot(otherSlot(activeSlot))
                  setEditorOpen(true)
                }}
                className="text-sm text-primary hover:underline"
              >
                Trocar carteira
              </button>
            </div>
            {wallets.isPending ? (
              <>
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </>
            ) : walletList.length > 0 ? (
              walletList.map((wallet) => (
                <WalletOptionCard
                  key={wallet.id}
                  wallet={wallet}
                  name="checkout-wallet"
                  checked={wallet.slot === activeSlot}
                  onSelect={() => selectSlot(wallet.slot)}
                  onEdit={() => {
                    selectSlot(wallet.slot)
                    setEditorOpen(true)
                  }}
                />
              ))
            ) : (
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/60 bg-surface p-5 text-sm text-primary"
              >
                <Plus className="size-4" aria-hidden="true" />
                Cadastrar carteira
              </button>
            )}
          </section>

          <div className="hidden md:block">
            {quote.isPending ? (
              <OrderReviewSkeleton />
            ) : quote.isError ? (
              <QueryErrorState
                error={quote.error}
                title="Não foi possível calcular a cotação"
                onRetry={() => quote.refetch()}
                isRetrying={quote.isFetching}
              />
            ) : (
              <OrderReview quote={quote.data} isRefreshing={quote.isFetching} />
            )}
          </div>

          {providerOptions}

          <div className="flex items-baseline justify-end gap-6 text-base font-bold md:hidden" aria-live="polite">
            <span>Total:</span>
            {quote.data ? (
              <span className="text-lg text-highlight">{formatEth(quote.data.summary.total, 6)}</span>
            ) : (
              <Skeleton className="h-6 w-24" />
            )}
          </div>

          <div
            ref={barRef}
            className="fixed inset-x-0 bottom-0 z-40 bg-background/95 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:bg-transparent md:p-0 md:backdrop-blur-none"
          >
            <button
              type="submit"
              disabled={!canConfirm}
              aria-describedby={staleReason ? 'stale-quote-alert' : undefined}
              className={confirmClass}
            >
              {flow.isBusy ? 'Confirmando…' : 'Confirmar compra'}
            </button>
          </div>
        </div>
      </div>

      {!isDesktop && (
        <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
          <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-[28px] border-surface-strong bg-surface">
            <SheetHeader>
              <SheetTitle>{savedWallet ? `Editar carteira ${savedWallet.label}` : 'Cadastrar carteira'}</SheetTitle>
              <SheetDescription>Os dados da carteira ficam salvos na sua conta.</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4">
              {wallets.data && (wallets.data.primary || wallets.data.secondary) && (
                <div className="mb-5">{otherWalletToggle}</div>
              )}
              <CheckoutFields form={form} layout="stack" />
            </div>
            <div className="sticky bottom-0 flex gap-3 border-t border-surface-strong bg-surface p-4">
              <button
                type="button"
                onClick={() => {
                  form.reset({ buyer: form.getValues('buyer'), wallet: walletDefaults(savedWallet, activeSlot) })
                  setEditorOpen(false)
                }}
                className="h-11 flex-1 rounded-full border border-foreground/15 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveEditor}
                disabled={upsertWallet.isPending}
                className="h-11 flex-1 rounded-full bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {upsertWallet.isPending ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <PlaceOrderDialog
        step={flow.state.step}
        error={flow.state.error}
        errorCode={flow.state.errorCode}
        provider={provider}
        previousQuote={flow.state.previousQuote}
        nextQuote={flow.state.nextQuote}
        savesWallet={flow.state.savesWallet}
        onConfirmReview={flow.confirmReview}
        onRetry={flow.retry}
        onClose={flow.reset}
      />
    </form>
  )
}
