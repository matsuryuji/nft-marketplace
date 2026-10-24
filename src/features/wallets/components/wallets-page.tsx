import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { toApiError } from '@/shared/api/errors'
import { controlClass, Field, SelectControl } from '@/shared/components/form-field'
import { QueryErrorState } from '@/shared/components/query-error-state'
import {
  upsertWalletRequestSchema,
  walletNetworks,
  walletProviderLabels,
  walletProviders,
  type UpsertWalletInput,
  type UpsertWalletRequest,
  type Wallet,
  type WalletSlot,
} from '@/shared/contracts/wallet'
import { cn } from '@/shared/lib/utils'
import { RadioDot } from '@/shared/ui/radio-dot'
import { Skeleton } from '@/shared/ui/skeleton'
import { useUpsertWallet, useWallets } from '../queries'

const networkLabels = { ethereum: 'Ethereum', polygon: 'Polygon' } as const
const slotCopy: Record<WalletSlot, { title: string; empty: string; defaultLabel: string }> = {
  primary: { title: 'Carteira principal', empty: 'Você ainda não adicionou uma carteira principal.', defaultLabel: 'Principal' },
  secondary: { title: 'Carteira secundária', empty: 'Você ainda não adicionou uma carteira secundária.', defaultLabel: 'Reserva' },
}

function toInput(wallet: Wallet | null, slot: WalletSlot): UpsertWalletInput {
  return {
    label: wallet?.label ?? slotCopy[slot].defaultLabel,
    network: wallet?.network ?? ('' as 'ethereum'),
    address: wallet?.address ?? '',
    ensName: wallet?.ensName ?? '',
    provider: wallet?.provider ?? ('' as 'metamask'),
  }
}

type WalletFormProps = {
  slot: WalletSlot
  wallet: Wallet | null
  template: Partial<UpsertWalletInput> | null
  onCancel?: () => void
}

function WalletForm({ slot, wallet, template, onCancel }: WalletFormProps) {
  const upsert = useUpsertWallet()
  const form = useForm<UpsertWalletInput, unknown, UpsertWalletRequest>({
    resolver: zodResolver(upsertWalletRequestSchema),
    defaultValues: { ...toInput(wallet, slot), ...template },
    mode: 'onTouched',
  })
  const { register, formState } = form
  const { errors } = formState

  useEffect(() => {
    if (template) {
      for (const [key, value] of Object.entries(template)) {
        form.setValue(key as keyof UpsertWalletInput, value as never, { shouldDirty: true })
      }
    }
  }, [template, form])

  const submit = form.handleSubmit((values) =>
    upsert.mutate(
      { slot, body: values },
      {
        onSuccess: (wallets) => {
          form.reset(toInput(wallets[slot], slot))
          toast.success(`${slotCopy[slot].title} salva.`)
          onCancel?.()
        },
        onError: (error) => {
          const apiError = toApiError(error)
          const fields = Object.entries(apiError.fields) as [keyof UpsertWalletInput, string][]
          fields.forEach(([field, message], index) => form.setError(field, { message }, { shouldFocus: index === 0 }))
          if (fields.length === 0) toast.error('Não foi possível salvar a carteira', { description: apiError.message })
        },
      },
    ),
  )

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <Field label="Nome da carteira" required error={errors.label}>
          {(props) => <input {...props} className={cn(controlClass, 'h-8')} {...register('label')} />}
        </Field>
        <Field label="Rede" required error={errors.network}>
          {(props) => (
            <SelectControl {...props} required className="invalid:text-muted-foreground/70" {...register('network')}>
              <option value="" disabled>
                Selecione uma rede
              </option>
              {walletNetworks.map((network) => (
                <option key={network} value={network}>
                  {networkLabels[network]}
                </option>
              ))}
            </SelectControl>
          )}
        </Field>
        <Field label="Endereço da carteira" required error={errors.address}>
          {(props) => (
            <input
              {...props}
              placeholder="Endereço 0x da carteira"
              spellCheck={false}
              autoComplete="off"
              className={cn(controlClass, 'h-8 font-mono')}
              {...register('address')}
            />
          )}
        </Field>
        <Field label="Nome ENS (opcional)" hideLabel error={errors.ensName}>
          {(props) => (
            <input
              {...props}
              placeholder="ENS ou carteira secundária (opcional)"
              autoComplete="off"
              className={cn(controlClass, 'h-8')}
              {...register('ensName')}
            />
          )}
        </Field>
        <Field label="Tipo de carteira" required error={errors.provider}>
          {(props) => (
            <SelectControl {...props} required className="invalid:text-muted-foreground/70" {...register('provider')}>
              <option value="" disabled>
                Selecione uma carteira
              </option>
              {walletProviders.map((provider) => (
                <option key={provider} value={provider}>
                  {walletProviderLabels[provider]}
                </option>
              ))}
            </SelectControl>
          )}
        </Field>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={upsert.isPending}
          className="h-9 rounded-[3px] bg-primary px-4 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {upsert.isPending ? 'Salvando…' : 'Salvar carteira'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-9 rounded-[3px] px-4 text-xs hover:text-highlight">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

function WalletSection({ slot, wallet, primary }: { slot: WalletSlot; wallet: Wallet | null; primary: Wallet | null }) {
  const titleId = useId()
  const [adding, setAdding] = useState(false)
  const [copyPrimary, setCopyPrimary] = useState(false)
  const copy = slotCopy[slot]
  const open = Boolean(wallet) || adding
  const template = copyPrimary && primary ? { network: primary.network, provider: primary.provider } : null

  return (
    <section aria-labelledby={titleId} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h2 id={titleId} className="text-[15px] font-bold">
            {copy.title}
          </h2>
          {slot === 'primary' ? (
            <p className="text-xs text-muted-foreground">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
          ) : (
            !open && <p className="text-xs text-muted-foreground">{copy.empty}</p>
          )}
          {slot === 'primary' && !open && <p className="mt-2 text-xs text-muted-foreground">{copy.empty}</p>}
        </div>
        <div className="flex items-center gap-3 text-xs">
          {slot === 'secondary' && !wallet && primary && (
            <button
              type="button"
              role="checkbox"
              aria-checked={copyPrimary}
              onClick={() => {
                setCopyPrimary((current) => !current)
                setAdding(true)
              }}
              className="flex items-center gap-2 rounded-md"
              title="Copia a rede e o tipo da carteira principal"
            >
              <RadioDot checked={copyPrimary} />
              Igual à carteira principal
            </button>
          )}
          {!open && (
            <button type="button" onClick={() => setAdding(true)} className="text-primary hover:underline">
              Adicionar
            </button>
          )}
        </div>
      </div>
      {open && (
        <WalletForm
          key={wallet?.id ?? 'new'}
          slot={slot}
          wallet={wallet}
          template={template}
          onCancel={
            wallet
              ? undefined
              : () => {
                  setAdding(false)
                  setCopyPrimary(false)
                }
          }
        />
      )}
    </section>
  )
}

export function WalletsPage() {
  const query = useWallets()

  if (query.isPending) {
    return (
      <div className="space-y-4" role="status" aria-label="Carregando carteiras">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </div>
    )
  }
  if (query.isError) {
    return <QueryErrorState error={query.error} title="Não foi possível carregar as carteiras" onRetry={() => query.refetch()} isRetrying={query.isFetching} />
  }

  return (
    <div className="space-y-10">
      <h1 className="sr-only">Carteiras</h1>
      <WalletSection slot="primary" wallet={query.data.primary} primary={query.data.primary} />
      <WalletSection slot="secondary" wallet={query.data.secondary} primary={query.data.primary} />
    </div>
  )
}
