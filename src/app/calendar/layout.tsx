'use client'

import { useState, useEffect, Suspense } from 'react'
import { CalendarProvider } from '@/calendar/contexts/calendar-context'
import type { IEvent, IUser } from '@/calendar/interfaces'
import PageGrid from '@/components/page-grid'
import { useToast } from '@/hooks/use-toast'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<IEvent[]>([])
  const [users, setUsers] = useState<IUser[]>([])
  const [_error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/events')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              `HTTP ${response.status}: Failed to fetch calendar data`,
          )
        }

        if (data.error) {
          throw new Error(data.error)
        }

        setEvents(data.events || [])
        setUsers(data.users || [])

        if (data.events?.length === 0 && data.users?.length === 0) {
        }

        setError(null)
      } catch (error: unknown) {
        console.error('Calendar fetch error:', error)
        setError((error as Error).message)
        toast({
          title: 'Calendar Error',
          description:
            (error as Error).message ||
            'Failed to load calendar data. Please try refreshing the page.',
          variant: 'destructive',
        })
      }
    }
    fetchData()
  }, [toast])

  return (
    <CalendarProvider events={events} users={users}>
      <PageGrid variant="gridTight" />
      <Suspense>{children}</Suspense>
    </CalendarProvider>
  )
}
