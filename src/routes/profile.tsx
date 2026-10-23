import { createFileRoute } from '@tanstack/react-router'
import { ComingSoonPage } from '@/shared/components/coming-soon-page'

export const Route = createFileRoute('/profile')({
  head: () => ({ meta: [{ title: 'Perfil do colecionador · Kurio' }] }),
  component: () => <ComingSoonPage title="Perfil do colecionador" />,
})
