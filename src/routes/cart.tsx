import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '@/features/cart/components/cart-page'

export const Route = createFileRoute('/cart')({
  staticData: { mobileNav: 'purchase-bar' },
  head: () => ({ meta: [{ title: 'Carrinho · Kurio' }] }),
  component: CartPage,
})
