import { z } from 'zod'
import { http, parseResponse } from '@/shared/api/client'
import {
  walletSessionSchema,
  walletsResponseSchema,
  type UpsertWalletRequest,
  type WalletProvider,
  type WalletSlot,
} from '@/shared/contracts/wallet'

const sessionResponseSchema = z.object({ session: walletSessionSchema.nullable() })

export async function fetchWallets(signal?: AbortSignal) {
  const { data } = await http.get('/wallets', { signal })
  return parseResponse(walletsResponseSchema, data)
}

export async function upsertWallet(slot: WalletSlot, body: UpsertWalletRequest) {
  const { data } = await http.put(`/wallets/${slot}`, body)
  return parseResponse(walletsResponseSchema, data)
}

export async function fetchWalletSession(signal?: AbortSignal) {
  const { data } = await http.get('/wallet-sessions/current', { signal })
  return parseResponse(sessionResponseSchema, data).session
}

export async function connectWallet(walletId: string, provider: WalletProvider) {
  const { data } = await http.post('/wallet-sessions/current', { walletId, provider })
  return parseResponse(sessionResponseSchema, data).session
}

export async function disconnectWallet() {
  await http.delete('/wallet-sessions/current')
}
