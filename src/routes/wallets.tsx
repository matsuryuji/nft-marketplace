import { createFileRoute } from '@tanstack/react-router'
import { ComingSoonPage } from '@/shared/components/coming-soon-page'

export const Route = createFileRoute('/wallets')({
  head: () => ({ meta: [{ title: 'Carteiras · Kurio' }] }),
  component: () => <ComingSoonPage title="Carteiras" />,
})
