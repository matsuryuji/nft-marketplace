import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '@/features/collection/components/collection-page'

export const Route = createFileRoute('/_auth/_account/collection')({
  head: () => ({ meta: [{ title: 'Minha coleção · Kurio' }] }),
  component: CollectionPage,
})
