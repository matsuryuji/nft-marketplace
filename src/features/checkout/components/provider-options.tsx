import { useId } from 'react'
import { walletProviderLabels, walletProviders, type WalletProvider } from '@/shared/contracts/wallet'
import { cn } from '@/shared/lib/utils'
import { RadioDot } from '@/shared/ui/radio-dot'

function ProviderBadge({ provider }: { provider: WalletProvider }) {
  return (
    <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2F1D15] text-[11px] font-bold text-primary">
      {provider === 'coinbase' ? (
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="1.5" y="3.5" width="13" height="9" rx="3" />
          <circle cx="10.5" cy="8" r="1.4" />
        </svg>
      ) : provider === 'walletconnect' ? (
        'W'
      ) : (
        'M'
      )}
    </span>
  )
}

type ProviderOptionsProps = {
  value: string
  onChange: (provider: WalletProvider) => void
  connectedProvider: WalletProvider | null
  onDisconnect: () => void
  disconnecting: boolean
  error?: string
}

export function ProviderOptions({ value, onChange, connectedProvider, onDisconnect, disconnecting, error }: ProviderOptionsProps) {
  const name = useId()
  return (
    <fieldset className="space-y-3" aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="mb-3 text-sm font-bold max-md:text-base md:w-full md:text-center">Carteira e rede</legend>
      {walletProviders.map((provider) => {
        const id = `${name}-${provider}`
        const checked = value === provider
        const connected = connectedProvider === provider
        return (
          <div
            key={provider}
            className={cn(
              'relative flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border bg-surface px-4 py-3 transition-colors md:flex-nowrap md:rounded-[3px] md:bg-transparent',
              checked ? 'border-primary' : 'border-transparent md:border-foreground/10',
            )}
          >
            <input
              type="radio"
              id={id}
              name={name}
              value={provider}
              checked={checked}
              onChange={() => onChange(provider)}
              className="peer sr-only"
            />
            <label
              htmlFor={id}
              className="flex flex-1 cursor-pointer items-center gap-3 rounded-md text-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring max-md:flex-row-reverse max-md:justify-between"
            >
              <RadioDot checked={checked} />
              <span className="flex flex-1 items-center gap-3">
                <span className="max-md:contents md:hidden">
                  <ProviderBadge provider={provider} />
                </span>
                {walletProviderLabels[provider]}
              </span>
            </label>
            {connected && (
              <span className="flex items-center gap-2 text-[11px] max-md:order-last max-md:w-full max-md:pl-10">
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-bold text-success">Conectada</span>
                <button
                  type="button"
                  onClick={onDisconnect}
                  disabled={disconnecting}
                  className="text-muted-foreground underline-offset-2 hover:text-destructive hover:underline disabled:opacity-50"
                >
                  Desconectar
                </button>
              </span>
            )}
          </div>
        )
      })}
      {error && (
        <p id={`${name}-error`} className="text-[11px] text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}
