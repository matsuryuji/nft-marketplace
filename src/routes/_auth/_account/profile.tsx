import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/features/profile/components/profile-page'

export const Route = createFileRoute('/_auth/_account/profile')({
  head: () => ({ meta: [{ title: 'Perfil do colecionador · Kurio' }] }),
  component: ProfilePage,
})
