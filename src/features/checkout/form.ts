import { z } from 'zod'
import type { User } from '@/shared/contracts/auth'
import { buyerSchema } from '@/shared/contracts/checkout'
import { upsertWalletRequestSchema, type Wallet, type WalletSlot } from '@/shared/contracts/wallet'

export const checkoutFormSchema = z.object({
  buyer: buyerSchema,
  wallet: upsertWalletRequestSchema,
})

export type CheckoutFormValues = z.input<typeof checkoutFormSchema>
export type CheckoutFormOutput = z.output<typeof checkoutFormSchema>

const slotLabels: Record<WalletSlot, string> = { primary: 'Principal', secondary: 'Reserva' }

export function walletDefaults(wallet: Wallet | null, slot: WalletSlot): CheckoutFormValues['wallet'] {
  return {
    label: wallet?.label ?? slotLabels[slot],
    network: wallet?.network ?? ('' as 'ethereum'),
    address: wallet?.address ?? '',
    ensName: wallet?.ensName ?? '',
    provider: wallet?.provider ?? ('' as 'metamask'),
  }
}

export function buyerDefaults(user: User | null): CheckoutFormValues['buyer'] {
  return {
    displayName: user?.displayName ?? '',
    username: user?.username ?? '',
    email: user?.email ?? '',
    referralCode: '',
    note: '',
  }
}
