'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createQueryClient } from '@/lib/cache/query-client'

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a new QueryClient instance for each app instance
  // This prevents state sharing between different users/sessions
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
