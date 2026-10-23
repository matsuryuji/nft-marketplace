import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { createQueryClient } from '@/app/query-client'
import { createAppRouter } from '@/app/router'
import { installSessionExpiryHandler } from '@/app/session-expiry'
import { env } from '@/shared/config/env'
import './index.css'

async function enableMocking() {
  if (!env.enableMocks) return
  const { startMockWorker } = await import('@/mocks/browser')
  await startMockWorker()
}

const queryClient = createQueryClient()
const router = createAppRouter(queryClient)
installSessionExpiryHandler(queryClient, router)

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
})
