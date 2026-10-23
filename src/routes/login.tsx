import { createFileRoute } from '@tanstack/react-router'
import { ComingSoonPage } from '@/shared/components/coming-soon-page'

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Entrar · Kurio' }] }),
  component: () => <ComingSoonPage title="Entrar" />,
})
