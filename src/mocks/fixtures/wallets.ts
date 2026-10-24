import type { WalletNetwork, WalletProvider, WalletSlot } from '@/shared/contracts/wallet'

export type WalletRecord = {
  id: string
  userId: string
  slot: WalletSlot
  label: string
  network: WalletNetwork
  address: string
  ensName: string | null
  provider: WalletProvider
  updatedAt: string
}

export type WalletSessionRecord = {
  id: string
  userId: string
  walletId: string
  provider: WalletProvider
  connectedAt: string
}

export const walletFixtures: WalletRecord[] = [
  {
    id: 'wallet-1',
    userId: 'user-1',
    slot: 'primary',
    label: 'Principal',
    network: 'ethereum',
    address: '0xA91F3b7c2D4e5F60718293a4B5c6D7e8F901E82C',
    ensName: null,
    provider: 'metamask',
    updatedAt: '2026-08-02T12:00:00.000Z',
  },
  {
    id: 'wallet-2',
    userId: 'user-1',
    slot: 'secondary',
    label: 'Reserva',
    network: 'polygon',
    address: '0x5c3E8a1B9d0F2e4C6a7B8d9E0f1A2b3C4d5E6f70',
    ensName: 'nova.kurio.eth',
    provider: 'walletconnect',
    updatedAt: '2026-08-03T12:00:00.000Z',
  },
  {
    id: 'wallet-3',
    userId: 'user-2',
    slot: 'primary',
    label: 'Principal',
    network: 'ethereum',
    address: '0x0dA4f9B2c8E1d7A3b5C6e9F0a1B2c3D4e5F6A7b8',
    ensName: 'criadora.eth',
    provider: 'coinbase',
    updatedAt: '2026-08-16T12:00:00.000Z',
  },
]
