import { createFileRoute } from '@tanstack/react-router'
import { WalletsPage } from '@/features/wallets/components/wallets-page'

export const Route = createFileRoute('/_auth/_account/wallets')({
  head: () => ({ meta: [{ title: 'Carteiras · Kurio' }] }),
  component: WalletsPage,
})
