import { Link } from '@tanstack/react-router'
import { AlertTriangle, Check, Loader2 } from 'lucide-react'
import type { Quote } from '@/shared/contracts/checkout'
import { walletProviderLabels, type WalletProvider } from '@/shared/contracts/wallet'
import { formatEth } from '@/shared/lib/eth'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'
import type { PlaceOrderStep } from '../use-place-order'

const progressSteps: { step: PlaceOrderStep; label: (provider: string) => string }[] = [
  { step: 'saving-wallet', label: () => 'Salvando carteira' },
  { step: 'connecting', label: (provider) => `Aprovando conexão na ${provider}` },
  { step: 'validating', label: () => 'Revalidando preços, disponibilidade e taxas' },
  { step: 'creating', label: () => 'Criando pedido' },
]

type PlaceOrderDialogProps = {
  step: PlaceOrderStep
  error: string | null
  errorCode: string | null
  provider: WalletProvider | ''
  previousQuote: Quote | null
  nextQuote: Quote | null
  savesWallet: boolean
  onConfirmReview: () => void
  onRetry: () => void
  onClose: () => void
}

function QuoteDiff({ previous, next }: { previous: Quote | null; next: Quote }) {
  const changes = next.items.flatMap((item) => {
    const before = previous?.items.find((entry) => entry.editionId === item.editionId)
    if (!before) return [`${item.name} (${item.editionLabel}) entrou no pedido.`]
    if (before.unitPrice !== item.unitPrice) {
      return [`${item.name} (${item.editionLabel}): ${formatEth(before.unitPrice, 4)} → ${formatEth(item.unitPrice, 4)}`]
    }
    if (before.quantity !== item.quantity) return [`${item.name}: quantidade ${before.quantity} → ${item.quantity}`]
    return []
  })
  const removed = previous?.items.filter((entry) => !next.items.some((item) => item.editionId === entry.editionId)) ?? []
  if (previous && previous.coupon?.code !== next.coupon?.code) {
    changes.push(next.coupon ? `Cupom ${next.coupon.code} aplicado.` : 'O cupom deixou de ser válido.')
  }

  return (
    <div className="space-y-3 text-sm">
      <ul className="space-y-1 rounded-[3px] border border-warning/40 bg-warning/10 p-3 text-xs">
        {[...changes, ...removed.map((entry) => `${entry.name} saiu do pedido.`)].map((change) => (
          <li key={change}>{change}</li>
        ))}
        {changes.length === 0 && removed.length === 0 && <li>As taxas ou o desconto foram recalculados.</li>}
      </ul>
      <dl className="space-y-1 text-xs">
        {previous && (
          <div className="flex justify-between text-muted-foreground">
            <dt>Total anterior</dt>
            <dd className="line-through">{formatEth(previous.summary.total, 6)}</dd>
          </div>
        )}
        <div className="flex justify-between font-bold">
          <dt>Novo total</dt>
          <dd className="text-highlight">{formatEth(next.summary.total, 6)}</dd>
        </div>
      </dl>
    </div>
  )
}

export function PlaceOrderDialog({
  step,
  error,
  errorCode,
  provider,
  previousQuote,
  nextQuote,
  savesWallet,
  onConfirmReview,
  onRetry,
  onClose,
}: PlaceOrderDialogProps) {
  const visibleSteps = progressSteps.filter((item) => savesWallet || item.step !== 'saving-wallet')
  const open = step !== 'idle'
  const busy = open && step !== 'review' && step !== 'error'
  const providerLabel = provider ? walletProviderLabels[provider] : 'carteira'
  const activeIndex = visibleSteps.findIndex((item) => item.step === (step === 'recovering' ? 'creating' : step))

  const title =
    step === 'review'
      ? 'Valores atualizados'
      : step === 'error'
        ? errorCode === 'WALLET_REJECTED'
          ? 'Conexão recusada'
          : 'Não foi possível concluir'
        : 'Confirmando sua compra'

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent
        showCloseButton={!busy}
        onEscapeKeyDown={(event) => busy && event.preventDefault()}
        onPointerDownOutside={(event) => busy && event.preventDefault()}
        className="border-surface-strong bg-surface sm:max-w-md"
      >
        <DialogTitle className="text-base">{title}</DialogTitle>

        {step === 'review' && nextQuote ? (
          <>
            <DialogDescription className="text-xs">
              Os valores mudaram desde que você revisou o pedido. Confirme o novo total para continuar.
            </DialogDescription>
            <QuoteDiff previous={previousQuote} next={nextQuote} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 flex-1 rounded-[4px] border border-foreground/15 text-sm hover:border-primary"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={onConfirmReview}
                className="h-10 flex-1 rounded-[4px] bg-primary text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                Confirmar novo total
              </button>
            </div>
          </>
        ) : step === 'error' ? (
          <>
            <DialogDescription asChild>
              <p role="alert" className="flex gap-2 text-sm text-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                {error}
              </p>
            </DialogDescription>
            <div className="flex gap-2">
              {errorCode === 'AVAILABILITY_CONFLICT' ? (
                <Link
                  to="/cart"
                  className="flex h-10 flex-1 items-center justify-center rounded-[4px] bg-primary text-sm font-bold text-primary-foreground hover:opacity-90"
                >
                  Revisar carrinho
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-10 flex-1 rounded-[4px] border border-foreground/15 text-sm hover:border-primary"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="h-10 flex-1 rounded-[4px] bg-primary text-sm font-bold text-primary-foreground hover:opacity-90"
                  >
                    Tentar novamente
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogDescription className="text-xs">Não feche esta página. Nenhum valor é cobrado duas vezes.</DialogDescription>
            <ol className="space-y-3" aria-live="polite">
              {visibleSteps.map((item, index) => {
                const done = index < activeIndex
                const current = index === activeIndex
                return (
                  <li key={item.step} className={cn('flex items-center gap-3 text-sm', !done && !current && 'text-muted-foreground/60')}>
                    <span className="flex size-5 items-center justify-center">
                      {done ? (
                        <Check className="size-4 text-success" aria-hidden="true" />
                      ) : current ? (
                        <Loader2 className="size-4 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                      )}
                    </span>
                    <span>
                      {item.label(providerLabel)}
                      {done && <span className="sr-only"> (concluído)</span>}
                      {current && <span className="sr-only"> (em andamento)</span>}
                    </span>
                  </li>
                )
              })}
            </ol>
            {step === 'recovering' && (
              <p role="status" className="rounded-[3px] bg-warning/10 p-3 text-xs">
                A rede demorou para responder. Verificando se o pedido já foi criado, sem gerar uma nova compra…
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
