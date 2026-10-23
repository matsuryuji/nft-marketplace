import { createFileRoute } from '@tanstack/react-router'
import { ComingSoonPage } from '@/shared/components/coming-soon-page'

export const Route = createFileRoute('/_auth/checkout')({
  head: () => ({ meta: [{ title: 'Pagamento · Kurio' }] }),
  component: () => <ComingSoonPage title="Pagamento" />,
})
