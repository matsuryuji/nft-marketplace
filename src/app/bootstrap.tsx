import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { createQueryClient } from './query-client'
import { createAppRouter } from './router'
import { installSessionExpiryHandler } from './session-expiry'

export function mount(container: HTMLElement) {
  const queryClient = createQueryClient()
  const router = createAppRouter(queryClient)
  installSessionExpiryHandler(queryClient, router)

  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}
