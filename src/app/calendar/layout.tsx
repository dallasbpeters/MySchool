'use client'

import { useState, useEffect } from 'react'
import { CalendarProvider } from "@/calendar/contexts/calendar-context"
import type { IEvent, IUser } from '@/calendar/interfaces'
import PageGrid from '@/components/page-grid'
import { useToast } from '@/hooks/use-toast'
import ColourfulText from '@/components/ui/colourful-text'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<IEvent[]>([])
  const [users, setUsers] = useState<IUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {

        const response = await fetch('/api/events')
        const data = await response.json()



        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}: Failed to fetch calendar data`)
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
          title: "Calendar Error",
          description: (error as Error).message || "Failed to load calendar data. Please try refreshing the page.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-background">
        <div className="text-center">
          <ColourfulText text="Loading calendar..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-background">
        <div className="text-center max-w-md">
          <div className="text-destructive mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Calendar Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <CalendarProvider events={events} users={users}>
      <PageGrid variant="grid" />
      {children}
    </CalendarProvider>
  )
}
