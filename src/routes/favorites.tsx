import { createFileRoute } from '@tanstack/react-router'
import { ComingSoonPage } from '@/shared/components/coming-soon-page'

export const Route = createFileRoute('/favorites')({
  head: () => ({ meta: [{ title: 'Favoritos · Kurio' }] }),
  component: () => <ComingSoonPage title="Favoritos" />,
})
