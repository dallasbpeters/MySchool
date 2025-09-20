import { useCalendar } from '@/calendar/contexts/calendar-context'

import type { IEvent } from '@/calendar/interfaces'

export function useUpdateEvent() {
  const { setLocalEvents, setCalendarItems } = useCalendar()

  const updateEvent = async (event: IEvent) => {
    const newEvent: IEvent = { ...event }
    newEvent.startDate = new Date(event.startDate).toISOString()
    newEvent.endDate = new Date(event.endDate).toISOString()

    // For assignments, recalculate color based on new due date
    if (event.type === 'assignment' && event.completionStatus) {
      const isOverdue = new Date(newEvent.startDate) < new Date()
      // Import the color calculation function
      const { getAssignmentColor } = await import('@/utils/assignment-display')
      newEvent.color = getAssignmentColor(event.completionStatus, isOverdue)
      console.log('Recalculated assignment color:', {
        oldColor: event.color,
        newColor: newEvent.color,
        isOverdue,
        newDueDate: newEvent.startDate
      })
    }


    // 🚀 OPTIMISTIC UPDATE: Update UI immediately for snappy feel
    setLocalEvents((prev) => {
      const index = prev.findIndex((e) => e.id === event.id)
      if (index === -1) return prev
      return [...prev.slice(0, index), newEvent, ...prev.slice(index + 1)]
    })

    // Also update calendar items for the enhanced calendar system
    setCalendarItems((prev) => {
      const index = prev.findIndex((item) => item.id === event.id)
      if (index === -1) return prev

      // Convert IEvent to CalendarItem format with proper type casting
      const updatedCalendarItem: typeof prev[0] = {
        ...prev[index],
        startDate: newEvent.startDate,
        endDate: newEvent.endDate,
        title: newEvent.title,
        color: newEvent.color as typeof prev[0]['color'],
        description: newEvent.description || prev[index].description
      }

      return [...prev.slice(0, index), updatedCalendarItem, ...prev.slice(index + 1)]
    })

    // Check if this is an assignment (has assignment- prefix)
    const isAssignment = event.id.startsWith('assignment-')

    if (isAssignment) {
      try {
        // Parse the assignment ID to get the actual UUID
        const actualAssignmentId = event.id.startsWith('assignment-')
          ? event.id.replace('assignment-', '')
          : event.id

        const requestBody = {
          due_date: newEvent.startDate.split('T')[0], // Convert to YYYY-MM-DD format
        }


        // For assignments, update only the due date using the minimal API endpoint
        const response = await fetch(`/api/assignments/${actualAssignmentId}/due-date`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })


        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Failed to update assignment due date')
        }

        const _data = await response.json()

        // ✅ SUCCESS: Assignment updated successfully
        // The optimistic update already happened above, so no need to refresh the entire calendar
        console.log('Assignment due date updated successfully - using optimistic update')
      } catch (error) {
        console.error('Assignment update failed:', error)

        // 🔄 REVERT OPTIMISTIC UPDATE: Restore original state on error
        setLocalEvents((prev) => {
          const index = prev.findIndex((e) => e.id === event.id)
          if (index === -1) return prev
          return [...prev.slice(0, index), event, ...prev.slice(index + 1)]
        })

        // Also revert calendar items
        setCalendarItems((prev) => {
          const index = prev.findIndex((item) => item.id === event.id)
          if (index === -1) return prev

          // Revert to original calendar item state
          const originalCalendarItem: typeof prev[0] = {
            ...prev[index],
            startDate: event.startDate,
            endDate: event.endDate,
            title: event.title,
            color: event.color as typeof prev[0]['color'],
            description: event.description || prev[index].description
          }

          return [...prev.slice(0, index), originalCalendarItem, ...prev.slice(index + 1)]
        })

        throw error // Re-throw to show error to user
      }
    } else {
      // For regular events, call the events API PUT endpoint
      try {
        const requestBody = {
          title: newEvent.title,
          description: newEvent.description || '',
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          color: newEvent.color,
          userId: newEvent.user?.id
        }


        const response = await fetch(`/api/events?id=${event.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })


        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Failed to update event')
        }

        const _data = await response.json()

      } catch (error) {
        console.error('Event update failed:', error)

        // 🔄 REVERT OPTIMISTIC UPDATE: Restore original state on error
        setLocalEvents((prev) => {
          const index = prev.findIndex((e) => e.id === event.id)
          if (index === -1) return prev
          return [...prev.slice(0, index), event, ...prev.slice(index + 1)]
        })

        // Also revert calendar items
        setCalendarItems((prev) => {
          const index = prev.findIndex((item) => item.id === event.id)
          if (index === -1) return prev

          // Revert to original calendar item state
          const originalCalendarItem: typeof prev[0] = {
            ...prev[index],
            startDate: event.startDate,
            endDate: event.endDate,
            title: event.title,
            color: event.color as typeof prev[0]['color'],
            description: event.description || prev[index].description
          }

          return [...prev.slice(0, index), originalCalendarItem, ...prev.slice(index + 1)]
        })

        throw error // Re-throw to show error to user
      }
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
