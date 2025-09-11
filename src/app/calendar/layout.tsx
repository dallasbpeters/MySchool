'use client'

import { useState, useEffect, Suspense } from 'react'
import { CalendarProvider } from '@/calendar/contexts/calendar-context'
import type { IEvent, IUser } from '@/calendar/interfaces'
import type { RolePermissions, CalendarItem } from '@/types/calendar-integration'
import PageGrid from '@/components/page-grid'
import { useToast } from '@/hooks/use-toast'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<IEvent[]>([])
  const [users, setUsers] = useState<IUser[]>([])
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([])
  const [userPermissions, setUserPermissions] = useState<RolePermissions | null>(null)
  const [_error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/events?t=${Date.now()}`)
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


        // Handle both old format (events only) and new format (events + assignments)
        if (data.assignments) {
          // New enhanced format - events and assignments separate
          setEvents(data.events || [])
          
          // Merge events and assignments into unified calendar items
          const mergedItems: CalendarItem[] = [
            ...(data.events || []),
            ...(data.assignments || [])
          ]
          setCalendarItems(mergedItems)
          
          
          // Set user permissions from API response
          if (data.permissions) {
            setUserPermissions(data.permissions)
          } else {
          }
        } else {
          // Legacy format - just events
          setEvents(data.events || [])
          setCalendarItems([]) // No assignments in legacy format
          
          // Default permissions for backward compatibility
          setUserPermissions({
            userId: 'default',
            role: 'parent', // Default to parent permissions
            canViewKanban: true,
            canCreateAssignments: true,
            canEditAssignments: true,
            canEditOwnEvents: true,
            canEditAllEvents: false,
            visibleAssignments: [],
            visibleEvents: []
          })
        }
        
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
    <CalendarProvider 
      events={events} 
      users={users} 
      initialPermissions={userPermissions}
      initialCalendarItems={calendarItems}
    >
      <PageGrid variant="gridTight" />
      <Suspense>{children}</Suspense>
    </CalendarProvider>
  )
}
