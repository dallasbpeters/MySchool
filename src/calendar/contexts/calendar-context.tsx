'use client'

import { createContext, useContext, useState, useEffect, useMemo } from 'react'

import type { Dispatch, SetStateAction } from 'react'
import type { IEvent, IUser } from '@/calendar/interfaces'
import type {
  TBadgeVariant,
  TVisibleHours,
  TWorkingHours,
} from '@/calendar/types'
import type { RolePermissions, CalendarItem } from '@/types/calendar-integration'

interface ICalendarContext {
  selectedDate: Date
  setSelectedDate: (date: Date | undefined) => void
  selectedUserId: IUser['id'] | 'all'
  setSelectedUserId: (userId: IUser['id'] | 'all') => void
  badgeVariant: TBadgeVariant
  setBadgeVariant: (variant: TBadgeVariant) => void
  users: IUser[]
  workingHours: TWorkingHours
  setWorkingHours: Dispatch<SetStateAction<TWorkingHours>>
  visibleHours: TVisibleHours
  setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>
  events: IEvent[]
  setLocalEvents: Dispatch<SetStateAction<IEvent[]>>
  
  // Enhanced calendar integration
  calendarItems: CalendarItem[]
  setCalendarItems: Dispatch<SetStateAction<CalendarItem[]>>
  userPermissions: RolePermissions | null
  setUserPermissions: Dispatch<SetStateAction<RolePermissions | null>>
  
  // Permission checks
  canViewKanban: () => boolean
  canCreateAssignments: () => boolean
  canEditAssignments: () => boolean
  canEditOwnEvents: () => boolean
  canEditAllEvents: () => boolean
  
  // Filtered items based on permissions
  visibleCalendarItems: CalendarItem[]
  visibleAssignments: CalendarItem[]
  visibleEvents: CalendarItem[]
  
  // Assignment completion actions
  toggleAssignmentCompletion: (assignmentId: string, studentId: string, completed: boolean) => Promise<void>
  syncCalendarData: () => Promise<void>
}

const CalendarContext = createContext({} as ICalendarContext)

const WORKING_HOURS = {
  0: { from: 8, to: 15 },
  1: { from: 8, to: 17 },
  2: { from: 8, to: 17 },
  3: { from: 8, to: 17 },
  4: { from: 8, to: 17 },
  5: { from: 8, to: 17 },
  6: { from: 8, to: 15 },
}

const VISIBLE_HOURS = { from: 6, to: 22 }

export function CalendarProvider({
  children,
  users,
  events,
  initialPermissions,
  initialCalendarItems,
}: {
  children: React.ReactNode
  users: IUser[]
  events: IEvent[]
  initialPermissions?: RolePermissions
  initialCalendarItems?: CalendarItem[]
}) {
  const [badgeVariant, setBadgeVariant] = useState<TBadgeVariant>('colored')
  const [visibleHours, setVisibleHours] = useState<TVisibleHours>(VISIBLE_HOURS)
  const [workingHours, setWorkingHours] = useState<TWorkingHours>(WORKING_HOURS)

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedUserId, setSelectedUserId] = useState<IUser['id'] | 'all'>(
    'all',
  )

  // Enhanced calendar integration state
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>(initialCalendarItems || [])
  const [userPermissions, setUserPermissions] = useState<RolePermissions | null>(
    initialPermissions || null
  )

  // This localEvents doesn't need to exists in a real scenario.
  // It's used here just to simulate the update of the events.
  // In a real scenario, the events would be updated in the backend
  // and the request that fetches the events should be refetched
  const [localEvents, setLocalEvents] = useState<IEvent[]>(events)

  // Update localEvents when events prop changes
  useEffect(() => {
    setLocalEvents(events)
  }, [events])

  // Update calendar items when initial data changes
  useEffect(() => {
    if (initialCalendarItems && initialCalendarItems.length > 0) {
      setCalendarItems(initialCalendarItems)
    }
  }, [initialCalendarItems])

  // Update permissions when initial permissions change
  useEffect(() => {
    if (initialPermissions) {
      setUserPermissions(initialPermissions)
    }
  }, [initialPermissions])

  // Effect to handle assignment completion updates in real-time
  useEffect(() => {
    const handleAssignmentUpdate = (event: CustomEvent) => {
      const { assignmentId, completed, studentId } = event.detail

      setCalendarItems(currentItems => 
        currentItems.map(item => {
          if (item.type === 'assignment' && item.assignmentId === assignmentId) {
            if (!item.completionStatus) return item

            const updatedCompletions = item.completionStatus.completions.map(completion =>
              completion.studentId === studentId
                ? { ...completion, completed, completedAt: completed ? new Date().toISOString() : undefined }
                : completion
            )

            const completedCount = updatedCompletions.filter(c => c.completed).length
            const allCompleted = completedCount === updatedCompletions.length

            return {
              ...item,
              completionStatus: {
                ...item.completionStatus,
                completions: updatedCompletions,
                completedCount,
                allCompleted,
              }
            }
          }
          return item
        })
      )
    }

    // Listen for assignment completion events
    window.addEventListener('assignment-completion-updated', handleAssignmentUpdate as EventListener)

    return () => {
      window.removeEventListener('assignment-completion-updated', handleAssignmentUpdate as EventListener)
    }
  }, [])

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
  }

  // Permission check functions
  const canViewKanban = () => {
    return userPermissions?.canViewKanban ?? false
  }

  const canCreateAssignments = () => {
    return userPermissions?.canCreateAssignments ?? false
  }

  const canEditAssignments = () => {
    return userPermissions?.canEditAssignments ?? false
  }

  const canEditOwnEvents = () => {
    return userPermissions?.canEditOwnEvents ?? false
  }

  const canEditAllEvents = () => {
    return userPermissions?.canEditAllEvents ?? false
  }

  // Filtered calendar items based on permissions and user selection
  const visibleCalendarItems = useMemo(() => {
    if (!userPermissions) {
      return []
    }

    const filtered = calendarItems.filter((item) => {
      // Role-based filtering
      if (item.type === 'assignment') {
        // Students can only see assignments they're assigned to
        if (userPermissions.role === 'student') {
          const canSee = item.assignedStudents?.some(
            student => student.studentId === userPermissions.userId
          ) ?? false
          return canSee
        }
        
        // Parents can see assignments for their children
        if (userPermissions.role === 'parent') {
          const canSee = item.assignedStudents?.some(
            student => userPermissions.studentIds?.includes(student.studentId)
          ) ?? false
          return canSee
        }
        
        // Admins can see all assignments
        return true
      }

      // Event filtering
      if (item.type === 'event') {
        // Students can see their own events and shared events
        if (userPermissions.role === 'student') {
          const canSee = item.user?.id === userPermissions.userId || 
                 userPermissions.visibleEvents.includes(item.id)
          return canSee
        }
        
        // Parents can see events from their children and their own
        if (userPermissions.role === 'parent') {
          const canSee = item.user?.id === userPermissions.userId ||
                 userPermissions.studentIds?.includes(item.user?.id || '') ||
                 userPermissions.visibleEvents.includes(item.id)
          return canSee
        }
        
        // Admins can see all events
        return true
      }

      return false
    })
    
    return filtered
  }, [calendarItems, userPermissions])

  // Separate assignment and event items
  const visibleAssignments = useMemo(() => {
    return visibleCalendarItems.filter(item => item.type === 'assignment')
  }, [visibleCalendarItems])

  const visibleEvents = useMemo(() => {
    return visibleCalendarItems.filter(item => item.type === 'event')
  }, [visibleCalendarItems])

  // Assignment completion with optimistic updates
  const toggleAssignmentCompletion = async (
    assignmentId: string, 
    studentId: string, 
    completed: boolean
  ) => {
    // Validate inputs
    if (!assignmentId || !studentId || typeof completed !== 'boolean') {
      return
    }

    // Optimistic update - immediately update the UI
    setCalendarItems(currentItems => 
      currentItems.map(item => {
        if (item.type === 'assignment' && item.assignmentId === assignmentId) {
          if (!item.completionStatus) return item

          const updatedCompletions = item.completionStatus.completions.map(completion =>
            completion.studentId === studentId
              ? { 
                  ...completion, 
                  completed, 
                  completedAt: completed ? new Date().toISOString() : undefined 
                }
              : completion
          )

          const completedCount = updatedCompletions.filter(c => c.completed).length
          const allCompleted = completedCount === updatedCompletions.length

          return {
            ...item,
            completionStatus: {
              ...item.completionStatus,
              completions: updatedCompletions,
              completedCount,
              allCompleted,
            }
          }
        }
        return item
      })
    )

    try {
      // Make API call to persist the change
      const response = await fetch(`/api/assignments/${assignmentId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update assignment completion: ${response.status} ${errorText}`)
      }

      // Emit custom event for other components to listen
      const event = new CustomEvent('assignment-completion-updated', {
        detail: { assignmentId, studentId, completed }
      })
      window.dispatchEvent(event)

    } catch (error) {
      // Revert optimistic update on error
      setCalendarItems(currentItems => 
        currentItems.map(item => {
          if (item.type === 'assignment' && item.assignmentId === assignmentId) {
            if (!item.completionStatus) return item

            const revertedCompletions = item.completionStatus.completions.map(completion =>
              completion.studentId === studentId
                ? { 
                    ...completion, 
                    completed: !completed, // Revert to opposite state
                    completedAt: !completed ? new Date().toISOString() : undefined 
                  }
                : completion
            )

            const completedCount = revertedCompletions.filter(c => c.completed).length
            const allCompleted = completedCount === revertedCompletions.length

            return {
              ...item,
              completionStatus: {
                ...item.completionStatus,
                completions: revertedCompletions,
                completedCount,
                allCompleted,
              }
            }
          }
          return item
        })
      )
      
      // Optionally show user-friendly error notification
      throw error // Re-throw for component-level error handling
    }
  }

  // Manual sync function for refreshing calendar data
  const syncCalendarData = async () => {
    if (!userPermissions) return

    try {
      const response = await fetch('/api/events', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        const mergedItems: CalendarItem[] = [
          ...data.events,
          ...data.assignments
        ]
        
        setCalendarItems(mergedItems)
      }
    } catch {
      // Silent error handling for sync
    }
  }

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate: handleSelectDate,
        selectedUserId,
        setSelectedUserId,
        badgeVariant,
        setBadgeVariant,
        users,
        visibleHours,
        setVisibleHours,
        workingHours,
        setWorkingHours,
        // If you go to the refetch approach, you can remove the localEvents and pass the events directly
        events: localEvents,
        setLocalEvents,
        
        // Enhanced calendar integration
        calendarItems,
        setCalendarItems,
        userPermissions,
        setUserPermissions,
        
        // Permission checks
        canViewKanban,
        canCreateAssignments,
        canEditAssignments,
        canEditOwnEvents,
        canEditAllEvents,
        
        // Filtered items based on permissions
        visibleCalendarItems,
        visibleAssignments,
        visibleEvents,
        
        // Assignment completion actions
        toggleAssignmentCompletion,
        syncCalendarData,
      }}
    >
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext)
  if (!context)
    throw new Error('useCalendar must be used within a CalendarProvider.')
  return context
}
