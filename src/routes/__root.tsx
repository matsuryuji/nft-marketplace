import { createRootRouteWithContext, HeadContent, Outlet, useMatches } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { authSearchSchema } from '@/features/auth/auth-search'
import { AuthDialog } from '@/features/auth/components/auth-dialog'
import { SessionWatcher } from '@/features/auth/components/session-watcher'
import { AppFooter } from '@/shared/components/app-footer'
import { AppHeader } from '@/shared/components/app-header'
import { MobileBottomNav } from '@/shared/components/mobile-bottom-nav'
import { Toaster } from '@/shared/ui/sonner'

type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: authSearchSchema,
  component: RootLayout,
})

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    mobileNav?: 'hidden'
  }
}

function RootLayout() {
  const hideMobileNav = useMatches({
    select: (matches) => matches.some((match) => match.staticData.mobileNav === 'hidden'),
  })

  return (
    <div className="flex min-h-dvh flex-col">
      <HeadContent />
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <AppHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <AppFooter className={hideMobileNav ? 'mb-36' : undefined} />
      {!hideMobileNav && <MobileBottomNav />}
      <AuthDialog />
      <SessionWatcher />
      <Toaster position="top-center" />
    </div>
  )
}
