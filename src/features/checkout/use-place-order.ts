import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useSession } from '@/features/auth/session'
import { cartKey } from '@/features/cart/queries'
import { collectionKey } from '@/features/collection/queries'
import { useConnectWallet, useUpsertWallet, useWallets, useWalletSession } from '@/features/wallets/queries'
import { ApiError, toApiError } from '@/shared/api/errors'
import type { Buyer, Order, Quote } from '@/shared/contracts/checkout'
import type { UpsertWalletRequest, Wallet, WalletSlot } from '@/shared/contracts/wallet'
import { createOrder, createQuote } from './api'
import { checkoutKeys } from './queries'

export type PlaceOrderStep = 'idle' | 'saving-wallet' | 'connecting' | 'validating' | 'review' | 'creating' | 'recovering' | 'error'

export type PlaceOrderInput = {
  buyer: Buyer
  wallet: UpsertWalletRequest
  walletDirty: boolean
  slot: WalletSlot
}

type FlowState = {
  step: PlaceOrderStep
  error: string | null
  errorCode: string | null
  previousQuote: Quote | null
  nextQuote: Quote | null
  savesWallet: boolean
}

const ATTEMPT_STORAGE_KEY = 'kurio.checkout.attempt'
const MAX_RECOVERY_ATTEMPTS = 3
const RECOVERY_DELAY_MS = 1_200

const idle: FlowState = { step: 'idle', error: null, errorCode: null, previousQuote: null, nextQuote: null, savesWallet: false }

function attemptKey(signature: string) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(ATTEMPT_STORAGE_KEY) ?? 'null') as { key: string; signature: string } | null
    if (stored?.signature === signature) return stored.key
    const key = crypto.randomUUID()
    sessionStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify({ key, signature }))
    return key
  } catch {
    return crypto.randomUUID()
  }
}

function clearAttempt() {
  try {
    sessionStorage.removeItem(ATTEMPT_STORAGE_KEY)
  } catch {
    return
  }
}

const isRecoverable = (error: ApiError) => error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR' || error.isTransient
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export function usePlaceOrder() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const wallets = useWallets()
  const walletSession = useWalletSession()
  const upsertWallet = useUpsertWallet()
  const connectWallet = useConnectWallet()
  const [state, setState] = useState<FlowState>(idle)
  const running = useRef(false)
  const pendingInput = useRef<PlaceOrderInput | null>(null)

  const userId = user?.id ?? ''
  const quoteKey = checkoutKeys.quote(userId)
  const fail = (error: unknown) => {
    const apiError = toApiError(error)
    setState((prev) => ({ ...prev, step: 'error', error: apiError.message, errorCode: apiError.code }))
  }

  async function ensureWallet(input: PlaceOrderInput): Promise<Wallet> {
    const saved = wallets.data?.[input.slot] ?? null
    if (saved && !input.walletDirty) return saved
    setState((prev) => ({ ...prev, step: 'saving-wallet' }))
    const updated = await upsertWallet.mutateAsync({ slot: input.slot, body: input.wallet })
    return updated[input.slot]!
  }

  async function ensureConnection(wallet: Wallet, input: PlaceOrderInput) {
    const session = walletSession.data
    if (session && session.walletId === wallet.id && session.provider === input.wallet.provider) return
    setState((prev) => ({ ...prev, step: 'connecting' }))
    await connectWallet.mutateAsync({ walletId: wallet.id, provider: input.wallet.provider })
  }

  async function submitOrder(quote: Quote, wallet: Wallet, input: PlaceOrderInput): Promise<Order> {
    const body = { quoteId: quote.id, walletId: wallet.id, provider: input.wallet.provider, buyer: input.buyer }
    const key = attemptKey(JSON.stringify(body))
    setState((prev) => ({ ...prev, step: 'creating' }))
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await createOrder(body, key)
      } catch (error) {
        const apiError = toApiError(error)
        if (!isRecoverable(apiError) || attempt >= MAX_RECOVERY_ATTEMPTS) throw apiError
        setState((prev) => ({ ...prev, step: 'recovering' }))
        await wait(RECOVERY_DELAY_MS)
      }
    }
  }

  async function finish(order: Order) {
    clearAttempt()
    queryClient.setQueryData(checkoutKeys.order(userId, order.id), order)
    queryClient.removeQueries({ queryKey: quoteKey })
    void queryClient.invalidateQueries({ queryKey: cartKey(userId) })
    void queryClient.invalidateQueries({ queryKey: collectionKey(userId) })
    setState(idle)
    await router.navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
  }

  async function run(input: PlaceOrderInput, confirmedQuote?: Quote) {
    if (running.current) return
    running.current = true
    pendingInput.current = input
    const savesWallet = input.walletDirty || !wallets.data?.[input.slot]
    setState({ ...idle, step: savesWallet ? 'saving-wallet' : 'connecting', savesWallet })
    try {
      const wallet = await ensureWallet(input)
      await ensureConnection(wallet, input)

      setState((prev) => ({ ...prev, step: 'validating' }))
      const displayed = confirmedQuote ?? queryClient.getQueryData<Quote>(quoteKey) ?? null
      const fresh = await createQuote()
      queryClient.setQueryData(quoteKey, fresh)
      if (!fresh.canCheckout) {
        throw new ApiError({ code: 'AVAILABILITY_CONFLICT', message: 'Um ou mais itens não estão mais disponíveis. Revise o carrinho.' })
      }
      if (!displayed || displayed.fingerprint !== fresh.fingerprint) {
        setState({ ...idle, step: 'review', previousQuote: displayed, nextQuote: fresh, savesWallet })
        return
      }

      try {
        await finish(await submitOrder(fresh, wallet, input))
      } catch (error) {
        const apiError = toApiError(error)
        if (apiError.code !== 'QUOTE_OUTDATED') throw apiError
        const updated = await createQuote()
        queryClient.setQueryData(quoteKey, updated)
        setState({ ...idle, step: 'review', previousQuote: fresh, nextQuote: updated, savesWallet })
      }
    } catch (error) {
      fail(error)
    } finally {
      running.current = false
    }
  }

  return {
    state,
    isBusy: state.step !== 'idle' && state.step !== 'review' && state.step !== 'error',
    placeOrder: (input: PlaceOrderInput) => run(input),
    confirmReview: () => {
      if (pendingInput.current && state.nextQuote) void run(pendingInput.current, state.nextQuote)
    },
    retry: () => {
      if (pendingInput.current) void run(pendingInput.current)
    },
    reset: () => setState(idle),
  }
}
