'use client'

import { QueryClient } from '@tanstack/react-query'

// Cache configuration based on data types
const cacheConfig = {
  userProfiles: 30 * 60 * 1000, // 30 minutes
  calendarEvents: 5 * 60 * 1000, // 5 minutes
  assignments: 10 * 60 * 1000, // 10 minutes
  realTimeData: 30 * 1000, // 30 seconds
  staticContent: 24 * 60 * 60 * 1000, // 24 hours
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default cache time (how long unused data stays in cache)
        gcTime: 1000 * 60 * 30, // 30 minutes
        // Default stale time (how long data is considered fresh)
        staleTime: 1000 * 60 * 5, // 5 minutes
        // Retry failed requests
        retry: (failureCount, error: unknown) => {
          // Don't retry on 4xx errors except 429 (rate limit)
          if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as { status: number }).status
            if (status >= 400 && status < 500 && status !== 429) {
              return false
            }
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        // Refetch on window focus for better data freshness
        refetchOnWindowFocus: true,
        // Refetch on reconnect after network issues
        refetchOnReconnect: true,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
      },
    },
  })
}

// Export cache configuration for use in hooks
export { cacheConfig }