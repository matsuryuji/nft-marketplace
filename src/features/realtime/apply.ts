import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cartKey } from '@/features/cart/queries'
import { nftKeys } from '@/features/catalog/queries'
import { checkoutKeys } from '@/features/checkout/queries'
import { favoritesKey } from '@/features/favorites/queries'
import { homeKeys } from '@/features/home/queries'
import type { Cart } from '@/shared/contracts/cart'
import type { Order } from '@/shared/contracts/checkout'
import type { HomeContent } from '@/shared/contracts/home'
import type { NftDetail, NftSummary } from '@/shared/contracts/nft'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/shared/contracts/realtime'

type Router = { navigate: (options: { to: '/orders/$orderId'; params: { orderId: string } }) => unknown }

function patchSummary<T extends NftSummary>(item: T, event: NftUpdatedEvent): T {
  if (item.id !== event.data.nftId || event.version <= item.version) return item
  return { ...item, floorPrice: event.data.floorPrice, available: event.data.available, version: event.version }
}

function patchNftData(data: unknown, event: NftUpdatedEvent): unknown {
  if (!data || typeof data !== 'object') return data
  if ('editions' in data && (data as NftDetail).id === event.data.nftId) {
    const detail = data as NftDetail
    if (event.version <= detail.version) return detail
    return {
      ...patchSummary(detail, event),
      editions: detail.editions.map((edition) => {
        const update = event.data.editions.find((item) => item.id === edition.id)
        return update ? { ...edition, price: update.price, available: update.available } : edition
      }),
    }
  }
  if ('items' in data && Array.isArray((data as { items: unknown[] }).items)) {
    const list = data as { items: NftSummary[] }
    if (!list.items.some((item) => 'floorPrice' in item && item.id === event.data.nftId)) return data
    return { ...list, items: list.items.map((item) => patchSummary(item, event)) }
  }
  return data
}

export function applyNftUpdated(queryClient: QueryClient, userId: string | null, event: NftUpdatedEvent) {
  queryClient.setQueriesData({ queryKey: nftKeys.all }, (data: unknown) => patchNftData(data, event))
  if (userId) queryClient.setQueryData(favoritesKey(userId), (data: unknown) => patchNftData(data, event))
  queryClient.setQueryData<HomeContent>(homeKeys.content(), (home) => {
    if (!home?.spotlight || home.spotlight.nft.id !== event.data.nftId) return home
    return { ...home, spotlight: { ...home.spotlight, nft: patchSummary(home.spotlight.nft, event) } }
  })

  const key = cartKey(userId)
  const cart = queryClient.getQueryData<Cart>(key)
  if (cart?.items.some((item) => item.nft.id === event.data.nftId)) {
    void queryClient.invalidateQueries({ queryKey: key })
    toast.info(`${event.data.name} teve preço ou disponibilidade atualizados.`, {
      id: `nft-updated-${event.data.nftId}`,
      description: 'O resumo do carrinho foi recalculado.',
    })
  }
}

export function applyOrderUpdated(queryClient: QueryClient, userId: string | null, event: OrderUpdatedEvent, router: Router) {
  if (!userId) return
  const key = checkoutKeys.order(userId, event.data.order.id)
  const previous = queryClient.getQueryData<Order>(key)
  if (previous && event.version <= previous.version) return
  queryClient.setQueryData(key, event.data.order)

  if (event.data.order.status === 'pending') return
  void queryClient.invalidateQueries({ queryKey: cartKey(userId) })
  if (previous || isOnOrderPage(event.data.order.id)) return
  const confirmed = event.data.order.status === 'confirmed'
  toast[confirmed ? 'success' : 'error'](confirmed ? 'Seu pedido foi confirmado.' : 'Seu pedido foi recusado.', {
    id: `order-${event.data.order.id}`,
    action: {
      label: 'Ver pedido',
      onClick: () => void router.navigate({ to: '/orders/$orderId', params: { orderId: event.data.order.id } }),
    },
  })
}

function isOnOrderPage(orderId: string) {
  return window.location.pathname === `/orders/${orderId}`
}
