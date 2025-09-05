import { useCalendar } from "@/calendar/contexts/calendar-context";

import type { IEvent } from "@/calendar/interfaces";

export function useUpdateEvent() {
  const { setLocalEvents } = useCalendar();

  // This is just and example, in a real scenario
  // you would call an API to update the event
  const updateEvent = (event: IEvent) => {
    const newEvent: IEvent = event;

    newEvent.startDate = new Date(event.startDate).toISOString();
    newEvent.endDate = new Date(event.endDate).toISOString();

    setLocalEvents(prev => {
      const index = prev.findIndex(e => e.id === event.id);
      if (index === -1) return prev;
      return [...prev.slice(0, index), newEvent, ...prev.slice(index + 1)];
    });
  };

  const deleteEvent = async (eventId: string) => {
    // Check if this is an assignment (has assignment- prefix)
    const isAssignment = eventId.startsWith('assignment-');

    if (isAssignment) {
      // For assignments, we just remove them from local state
      // In a real app, you might want to prevent deletion or handle differently
      setLocalEvents(prev => prev.filter(e => e.id !== eventId));
      return { success: true, message: 'Assignment removed from calendar' };
    }

    try {
      // For regular events, call the DELETE API
      const response = await fetch(`/api/events?id=${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete event');
      }

      // Remove from local state
      setLocalEvents(prev => prev.filter(e => e.id !== eventId));

      const data = await response.json();
      return { success: true, message: data.message || 'Event deleted successfully' };
    } catch (error) {
      console.error('Error deleting event:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  return { updateEvent, deleteEvent };
}
