import { MoreVertical } from 'lucide-react'
import { walletNetworkLabels, type Wallet } from '@/shared/contracts/wallet'
import { RadioDot } from '@/shared/ui/radio-dot'

const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

type WalletOptionCardProps = {
  wallet: Wallet
  checked: boolean
  name: string
  onSelect: () => void
  onEdit: () => void
}

export function WalletOptionCard({ wallet, checked, name, onSelect, onEdit }: WalletOptionCardProps) {
  const inputId = `${name}-${wallet.id}`
  return (
    <div className="relative flex items-start gap-3 rounded-2xl bg-surface p-4">
      <input
        type="radio"
        id={inputId}
        name={name}
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />
      <label
        htmlFor={inputId}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-lg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring"
      >
        <RadioDot checked={checked} className="mt-0.5" />
        <span className="min-w-0 space-y-1">
          <span className="block text-sm font-bold">{wallet.label}</span>
          <span className="block truncate text-xs text-highlight">{wallet.ensName ?? shortAddress(wallet.address)}</span>
          <span className="block text-xs text-muted-foreground">{walletNetworkLabels[wallet.network]}</span>
        </span>
      </label>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Editar carteira ${wallet.label}`}
        className="-mt-1 -mr-2 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
      >
        <MoreVertical className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
