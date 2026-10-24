import { lazy, Suspense, useEffect, useState } from 'react'
import { createRootRouteWithContext, HeadContent, Outlet, useMatches } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { authSearchSchema } from '@/features/auth/auth-search'
import { SessionWatcher } from '@/features/auth/components/session-watcher'
import { RealtimeIndicator } from '@/features/realtime/realtime-indicator'
import { RealtimeProvider } from '@/features/realtime/realtime-provider'
import { AppFooter } from '@/shared/components/app-footer'
import { AppHeader } from '@/shared/components/app-header'
import { MobileBottomNav } from '@/shared/components/mobile-bottom-nav'
import { cn } from '@/shared/lib/utils'
import { Toaster } from '@/shared/ui/sonner'

type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: authSearchSchema,
  component: RootLayout,
})

const AuthDialog = lazy(() => import('@/features/auth/components/auth-dialog').then((module) => ({ default: module.AuthDialog })))

function DeferredAuthDialog() {
  const authMode = Route.useSearch({ select: (search) => search.auth })
  const [needed, setNeeded] = useState(Boolean(authMode))

  useEffect(() => {
    if (authMode) setNeeded(true)
  }, [authMode])

  if (!needed) return null
  return (
    <Suspense fallback={null}>
      <AuthDialog />
    </Suspense>
  )
}

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    mobileNav?: 'hidden' | 'purchase-bar'
    mobileFooter?: 'hidden'
    footer?: 'hidden'
  }
}

function RootLayout() {
  const hideMobileFooter = useMatches({
    select: (matches) => matches.some((match) => match.staticData.mobileFooter === 'hidden'),
  })
  const hideFooter = useMatches({
    select: (matches) => matches.some((match) => match.staticData.footer === 'hidden'),
  })
  const mobileNav = useMatches({
    select: (matches) => [...matches].reverse().find((match) => match.staticData.mobileNav)?.staticData.mobileNav,
  })

  return (
    <RealtimeProvider>
      <div className="flex min-h-dvh flex-col">
        <HeadContent />
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Pular para o conteúdo
        </a>
        <AppHeader />
        <main id="main-content" tabIndex={-1} className="min-h-dvh flex-1 focus:outline-none">
          <Outlet />
        </main>
        {!hideFooter && (
          <AppFooter
            className={cn(
              mobileNav === 'purchase-bar' ? 'mb-[var(--mobile-bar-height,0px)]' : mobileNav === 'hidden' ? 'mb-0' : undefined,
              hideMobileFooter && 'max-md:hidden',
            )}
          />
        )}
        {!mobileNav && <MobileBottomNav />}
        <DeferredAuthDialog />
        <SessionWatcher />
        <RealtimeIndicator />
        <Toaster position="top-center" />
      </div>
    </RealtimeProvider>
  )
}
