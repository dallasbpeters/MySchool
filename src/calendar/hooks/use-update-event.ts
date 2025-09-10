import { useCalendar } from '@/calendar/contexts/calendar-context'

import type { IEvent } from '@/calendar/interfaces'

export function useUpdateEvent() {
  const { setLocalEvents } = useCalendar()

  const updateEvent = async (event: IEvent) => {
    const newEvent: IEvent = event

    newEvent.startDate = new Date(event.startDate).toISOString()
    newEvent.endDate = new Date(event.endDate).toISOString()

    // 🚀 OPTIMISTIC UPDATE: Update UI immediately for snappy feel
    setLocalEvents((prev) => {
      const index = prev.findIndex((e) => e.id === event.id)
      if (index === -1) return prev
      return [...prev.slice(0, index), newEvent, ...prev.slice(index + 1)]
    })

    // Check if this is an assignment (has assignment- prefix)
    const isAssignment = event.id.startsWith('assignment-')

    if (isAssignment) {
      try {
        // Parse the assignment ID to get the actual UUID
        const actualAssignmentId = event.id.startsWith('assignment-')
          ? event.id.replace('assignment-', '')
          : event.id

        console.log('🔍 CLIENT DEBUG - Updating assignment:')
        console.log('  - Original event ID:', event.id)
        console.log('  - Parsed assignment ID:', actualAssignmentId)
        console.log('  - New due date:', newEvent.startDate)
        console.log('  - Event object:', event)

        const requestBody = {
          title: event.title,
          content: event.description || '',
          links: [],
          due_date: newEvent.startDate.split('T')[0], // Convert to YYYY-MM-DD format
          category: '',
          selectedChildren: [], // Empty array to preserve existing assignments
          is_recurring: false,
          recurrence_pattern: null,
          recurrence_end_date: null,
        }
        console.log('  - Request body:', requestBody)
        console.log('  - API URL:', `/api/assignments?id=${actualAssignmentId}`)

        // For assignments, update the due date using the existing assignments API
        const response = await fetch(`/api/assignments?id=${actualAssignmentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        console.log('  - Response status:', response.status)
        console.log('  - Response ok:', response.ok)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Failed to update assignment due date')
        }

        const data = await response.json()
        console.log('✅ Assignment updated successfully:', data.message)

        // 🎨 FORCE COLOR UPDATE: Always refresh for assignments to ensure colors are correct
        console.log('🔄 Refreshing calendar to update assignment colors...')
        try {
          const eventsResponse = await fetch('/api/events')
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json()
            if (eventsData.events) {
              setLocalEvents(eventsData.events)
              console.log('✅ Calendar refreshed with updated colors')
              return
            }
          }
          console.error('Failed to refresh calendar: Invalid response')
        } catch (refreshError) {
          console.error('Failed to refresh calendar:', refreshError)
        }
      } catch (error) {
        console.error('❌ Assignment update failed:', error)

        // 🔄 REVERT OPTIMISTIC UPDATE: Restore original state on error
        setLocalEvents((prev) => {
          const index = prev.findIndex((e) => e.id === event.id)
          if (index === -1) return prev
          return [...prev.slice(0, index), event, ...prev.slice(index + 1)]
        })

        throw error // Re-throw to show error to user
      }
    } else {
      // For regular events, call the events API (if you have one)
      // This would be implemented when you have a regular events update API
      console.log('Regular event update - implement events API call here')
      // For now, the optimistic update at the beginning is sufficient
    }

    // Note: We use optimistic updates, so local state is already updated
    // Only additional updates happen if colors need to change or on error reversion
  }

  const deleteEvent = async (eventId: string) => {
    // Check if this is an assignment (has assignment- prefix)
    const isAssignment = eventId.startsWith('assignment-')

    if (isAssignment) {
      // For assignments, we just remove them from local state
      // In a real app, you might want to prevent deletion or handle differently
      setLocalEvents((prev) => prev.filter((e) => e.id !== eventId))
      return { success: true, message: 'Assignment removed from calendar' }
    }

    try {
      // For regular events, call the DELETE API
      const response = await fetch(`/api/events?id=${eventId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to delete event')
      }

      // Remove from local state
      setLocalEvents((prev) => prev.filter((e) => e.id !== eventId))

      const data = await response.json()
      return {
        success: true,
        message: data.message || 'Event deleted successfully',
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  return { updateEvent, deleteEvent }
}
