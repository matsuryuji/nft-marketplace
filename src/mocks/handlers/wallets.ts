import { delay, http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import { connectWalletRequestSchema, upsertWalletRequestSchema, walletSlots, type Wallet, type WalletSlot } from '@/shared/contracts/wallet'
import { db } from '../db'
import type { WalletRecord } from '../fixtures/wallets'
import { randomToken } from '../lib/crypto'
import { errorResponse, simulateNetwork } from '../lib/http'
import { requireSession } from '../lib/session'
import { scenarioStore } from '../scenarios'

const CONNECT_DELAY_MS = 900

function toWallet(record: WalletRecord | undefined): Wallet | null {
  if (!record) return null
  return {
    id: record.id,
    slot: record.slot,
    label: record.label,
    network: record.network,
    address: record.address,
    ensName: record.ensName,
    provider: record.provider,
    updatedAt: record.updatedAt,
  }
}

function walletsOf(userId: string) {
  const wallets = db.state.wallets.filter((wallet) => wallet.userId === userId)
  return {
    primary: toWallet(wallets.find((wallet) => wallet.slot === 'primary')),
    secondary: toWallet(wallets.find((wallet) => wallet.slot === 'secondary')),
  }
}

function currentSession(userId: string) {
  return db.state.walletSessions.find((session) => session.userId === userId) ?? null
}

export const walletHandlers = [
  http.get(`${env.apiUrl}/wallets`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    return HttpResponse.json(walletsOf(auth.user.id))
  }),

  http.put(`${env.apiUrl}/wallets/:slot`, async ({ request, params, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    if (scenarioStore.current === 'server-error') {
      return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Não foi possível salvar a carteira agora. Tente novamente.')
    }
    const slot = params.slot as WalletSlot
    if (!walletSlots.includes(slot)) return errorResponse(404, 'NOT_FOUND', 'Carteira não encontrada.')

    const parsed = upsertWalletRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      const fields = Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]))
      return errorResponse(422, 'VALIDATION_ERROR', 'Verifique os dados da carteira.', fields)
    }

    const { state } = db
    const address = parsed.data.address.toLowerCase()
    const duplicate = state.wallets.find(
      (wallet) => wallet.address.toLowerCase() === address && !(wallet.userId === auth.user.id && wallet.slot === slot),
    )
    if (duplicate) {
      return errorResponse(409, 'CONFLICT', 'Este endereço já está cadastrado em outra carteira.', {
        address: 'Este endereço já está cadastrado em outra carteira',
      })
    }

    const existing = state.wallets.find((wallet) => wallet.userId === auth.user.id && wallet.slot === slot)
    const record: WalletRecord = {
      id: existing?.id ?? `wallet-${randomToken(6)}`,
      userId: auth.user.id,
      slot,
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    }
    state.wallets = [...state.wallets.filter((wallet) => wallet !== existing), record]
    if (existing) state.walletSessions = state.walletSessions.filter((session) => session.walletId !== existing.id)
    db.persist()
    return HttpResponse.json(walletsOf(auth.user.id))
  }),

  http.get(`${env.apiUrl}/wallet-sessions/current`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    return HttpResponse.json({ session: currentSession(auth.user.id) })
  }),

  http.post(`${env.apiUrl}/wallet-sessions/current`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response

    const parsed = connectWalletRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return errorResponse(422, 'VALIDATION_ERROR', 'Selecione uma carteira e uma rede.')
    const wallet = db.state.wallets.find((item) => item.id === parsed.data.walletId)
    if (!wallet) return errorResponse(404, 'NOT_FOUND', 'Carteira não encontrada.')
    if (wallet.userId !== auth.user.id) return errorResponse(403, 'FORBIDDEN', 'Esta carteira pertence a outra conta.')

    await delay(CONNECT_DELAY_MS)
    if (scenarioStore.current === 'wallet-rejected') {
      return errorResponse(409, 'WALLET_REJECTED', 'A conexão foi recusada na carteira. Aprove a solicitação para continuar.')
    }

    const session = {
      id: `wsession-${randomToken(6)}`,
      userId: auth.user.id,
      walletId: wallet.id,
      provider: parsed.data.provider,
      connectedAt: new Date().toISOString(),
    }
    db.state.walletSessions = [...db.state.walletSessions.filter((item) => item.userId !== auth.user.id), session]
    db.persist()
    return HttpResponse.json({ session }, { status: 201 })
  }),

  http.delete(`${env.apiUrl}/wallet-sessions/current`, async ({ request, cookies }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    const auth = requireSession(cookies)
    if (!auth.ok) return auth.response
    db.state.walletSessions = db.state.walletSessions.filter((item) => item.userId !== auth.user.id)
    db.persist()
    return HttpResponse.json({ session: null })
  }),
]
