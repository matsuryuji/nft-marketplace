import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/features/orders/components/order-page'

export const Route = createFileRoute('/_auth/orders/$orderId')({
  head: () => ({ meta: [{ title: 'Pedido · Kurio' }] }),
  component: function OrderRoute() {
    const { orderId } = Route.useParams()
    return <OrderPage key={orderId} orderId={orderId} />
  },
})
