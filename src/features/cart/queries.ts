import Decimal from 'decimal.js'
import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { guestKeys, privateKeys, useSession } from '@/features/auth/session'
import { toApiError } from '@/shared/api/errors'
import type { AddCartItemRequest, Cart } from '@/shared/contracts/cart'
import {
  acknowledgePrices,
  addCartItem,
  applyCoupon,
  fetchCart,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from './api'

export const cartKey = (userId: string | null) =>
  userId ? ([...privateKeys.user(userId), 'cart'] as const) : ([...guestKeys.all, 'cart'] as const)

export const cartQuery = (userId: string | null) =>
  queryOptions({
    queryKey: cartKey(userId),
    queryFn: ({ signal }) => fetchCart(signal),
    staleTime: 10_000,
  })

function useCartKey() {
  const { user, isPending } = useSession()
  return { key: cartKey(user?.id ?? null), userId: user?.id ?? null, ready: !isPending }
}

export function useCart() {
  const { userId, ready } = useCartKey()
  return useQuery({ ...cartQuery(userId), enabled: ready })
}

function storeCart(queryClient: QueryClient, key: readonly unknown[], next: Cart) {
  queryClient.setQueryData<Cart>(key, (current) => (!current || next.version >= current.version ? next : current))
}

function withQuantity(cart: Cart, itemId: string, quantity: number): Cart {
  const items = cart.items.map((item) =>
    item.id === itemId
      ? { ...item, quantity, lineTotal: new Decimal(item.unitPrice).times(quantity).toFixed() }
      : item,
  )
  return { ...cart, items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) }
}

function withoutItem(cart: Cart, itemId: string): Cart {
  const items = cart.items.filter((item) => item.id !== itemId)
  return { ...cart, items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) }
}

function useOptimisticCartMutation<TVariables>(options: {
  mutationFn: (variables: TVariables) => Promise<Cart>
  optimistic?: (cart: Cart, variables: TVariables) => Cart
  errorTitle: string
}) {
  const queryClient = useQueryClient()
  const { key } = useCartKey()

  return useMutation({
    mutationFn: options.mutationFn,
    onMutate: async (variables) => {
      if (!options.optimistic) return { previous: undefined }
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Cart>(key)
      if (previous) queryClient.setQueryData<Cart>(key, options.optimistic(previous, variables))
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error(options.errorTitle, { description: toApiError(error).message })
      void queryClient.invalidateQueries({ queryKey: key })
    },
    onSuccess: (cart) => storeCart(queryClient, key, cart),
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const { key } = useCartKey()
  return useMutation({
    mutationFn: (body: AddCartItemRequest) => addCartItem(body),
    onSuccess: (cart) => storeCart(queryClient, key, cart),
  })
}

export function useUpdateCartItem() {
  return useOptimisticCartMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => updateCartItem(itemId, quantity),
    optimistic: (cart, { itemId, quantity }) => withQuantity(cart, itemId, quantity),
    errorTitle: 'Não foi possível alterar a quantidade',
  })
}

export function useRemoveCartItem() {
  return useOptimisticCartMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    optimistic: withoutItem,
    errorTitle: 'Não foi possível remover o item',
  })
}

export function useAcknowledgePrices() {
  return useOptimisticCartMutation({
    mutationFn: () => acknowledgePrices(),
    errorTitle: 'Não foi possível atualizar os preços',
  })
}

export function useCouponMutations() {
  const queryClient = useQueryClient()
  const { key } = useCartKey()
  const apply = useMutation({
    mutationFn: (code: string) => applyCoupon(code),
    onSuccess: (cart) => storeCart(queryClient, key, cart),
  })
  const remove = useMutation({
    mutationFn: () => removeCoupon(),
    onSuccess: (cart) => storeCart(queryClient, key, cart),
    onError: (error) => toast.error('Não foi possível remover o cupom', { description: toApiError(error).message }),
  })
  return { apply, remove }
}
