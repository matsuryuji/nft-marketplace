import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AccountNav } from '@/features/profile/components/account-nav'

export const Route = createFileRoute('/_auth/_account')({
  component: AccountLayout,
})

function AccountLayout() {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 sm:px-6 md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-6 md:py-8">
      <aside className="min-w-0 md:self-start">
        <AccountNav />
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
