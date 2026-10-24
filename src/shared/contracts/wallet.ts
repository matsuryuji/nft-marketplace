import { z } from 'zod'

export const walletSlots = ['primary', 'secondary'] as const
export const walletNetworks = ['ethereum', 'polygon'] as const
export const walletProviders = ['walletconnect', 'metamask', 'coinbase'] as const

export const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/
export const ENS_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/

export const optionalEnsName = z
  .string()
  .nullable()
  .transform((value) => (value ?? '').trim().toLowerCase())
  .refine((value) => value.length <= 48, 'Use no máximo 48 caracteres')
  .refine((value) => value === '' || ENS_PATTERN.test(value), 'Use apenas letras, números e hífen')
  .transform((value) => (value === '' ? null : value))

export const walletSchema = z.object({
  id: z.string(),
  slot: z.enum(walletSlots),
  label: z.string(),
  network: z.enum(walletNetworks),
  address: z.string(),
  ensName: z.string().nullable(),
  provider: z.enum(walletProviders),
  updatedAt: z.string(),
})

export const walletsResponseSchema = z.object({
  primary: walletSchema.nullable(),
  secondary: walletSchema.nullable(),
})

export const upsertWalletRequestSchema = z.object({
  label: z.string().trim().min(2, 'Use pelo menos 2 caracteres').max(32, 'Use no máximo 32 caracteres'),
  network: z.enum(walletNetworks, { error: 'Selecione uma rede' }),
  address: z.string().trim().regex(EVM_ADDRESS_PATTERN, 'Informe um endereço 0x com 40 caracteres hexadecimais'),
  ensName: optionalEnsName,
  provider: z.enum(walletProviders, { error: 'Selecione o tipo de carteira' }),
})

export const walletSessionSchema = z.object({
  id: z.string(),
  walletId: z.string(),
  provider: z.enum(walletProviders),
  connectedAt: z.string(),
})

export const connectWalletRequestSchema = z.object({
  walletId: z.string(),
  provider: z.enum(walletProviders),
})

export const walletProviderLabels: Record<WalletProvider, string> = {
  walletconnect: 'WalletConnect',
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
}

export const walletNetworkLabels: Record<WalletNetwork, string> = {
  ethereum: 'Rede principal Ethereum',
  polygon: 'Rede Polygon',
}

export type WalletSlot = (typeof walletSlots)[number]
export type WalletNetwork = (typeof walletNetworks)[number]
export type WalletProvider = (typeof walletProviders)[number]
export type Wallet = z.infer<typeof walletSchema>
export type WalletsResponse = z.infer<typeof walletsResponseSchema>
export type UpsertWalletInput = z.input<typeof upsertWalletRequestSchema>
export type UpsertWalletRequest = z.output<typeof upsertWalletRequestSchema>
export type WalletSession = z.infer<typeof walletSessionSchema>
