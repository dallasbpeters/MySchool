import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { TEventFormData } from '@/calendar/schemas'

export function useEvents() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const createEvent = async (eventData: TEventFormData) => {
    setIsLoading(true)
    try {
      // Create proper ISO date strings
      const startDate = new Date(eventData.startDate)
      startDate.setHours(eventData.startTime.hour, eventData.startTime.minute, 0, 0)

      const endDate = new Date(eventData.endDate)
      endDate.setHours(eventData.endTime.hour, eventData.endTime.minute, 0, 0)

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          color: eventData.color,
          userId: eventData.user
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event')
      }

      toast({
        title: "Success",
        description: data.message || "Event created successfully",
      })

      // Refresh the page to update calendar data
      window.location.reload()

      return data.event
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to create event",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateEvent = async (eventId: string, eventData: TEventFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/events?id=${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          startDate: `${eventData.startDate}T${eventData.startTime.hour.toString().padStart(2, '0')}:${eventData.startTime.minute.toString().padStart(2, '0')}:00`,
          endDate: `${eventData.endDate}T${eventData.endTime.hour.toString().padStart(2, '0')}:${eventData.endTime.minute.toString().padStart(2, '0')}:00`,
          color: eventData.color,
          userId: eventData.user
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update event')
      }

      toast({
        title: "Success",
        description: data.message || "Event updated successfully",
      })

      // Refresh the page to update calendar data
      window.location.reload()

      return data.event
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to update event",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const deleteEvent = async (eventId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/events?id=${eventId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete event')
      }

      toast({
        title: "Success",
        description: data.message || "Event deleted successfully",
      })

      // Refresh the page to update calendar data
      window.location.reload()

      return true
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to delete event",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    isLoading
  }
}
