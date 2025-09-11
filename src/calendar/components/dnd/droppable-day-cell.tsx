'use client'

import { useMemo, useCallback } from 'react'
import { useDrop, DropTargetMonitor } from 'react-dnd'
import { parseISO, differenceInMilliseconds } from 'date-fns'

import { useUpdateEvent } from '@/calendar/hooks/use-update-event'

import { cn } from '@/lib/utils'
import { ItemTypes } from '@/calendar/components/dnd/draggable-event'

import type { IEvent, ICalendarCell } from '@/calendar/interfaces'
import type { CalendarItem } from '@/types/calendar-integration'

interface DroppableDayCellProps {
  cell: ICalendarCell
  children: React.ReactNode
}

export function DroppableDayCell({ cell, children }: DroppableDayCellProps) {
  const { updateEvent } = useUpdateEvent()

  // 🔧 Stabilize drop handler to prevent React DND target errors
  const handleDrop = useCallback(async (item: { event: IEvent | CalendarItem }) => {
    const droppedEvent = item.event

    // Check if this is an assignment - assignments have different update logic
    if (droppedEvent.type === 'assignment') {
      // For assignments, we update the due_date, not start/end dates
      const newDueDate = new Date(cell.date)
      // Keep the same time as the original due date
      const originalDate = parseISO(droppedEvent.startDate)
      newDueDate.setHours(
        originalDate.getHours(),
        originalDate.getMinutes(),
        originalDate.getSeconds(),
        originalDate.getMilliseconds(),
      )

      try {
        // TODO: We need an updateAssignment function for this
        // For now, just show a message that assignments can't be moved via drag/drop
        return { moved: false, error: 'Assignment drag and drop not yet implemented' }
      } catch (error) {
        console.error('Failed to move assignment:', error)
        return { moved: false, error: error }
      }
    }

    // Handle regular events
    const eventStartDate = parseISO(droppedEvent.startDate)
    const eventEndDate = parseISO(droppedEvent.endDate)

    const eventDurationMs = differenceInMilliseconds(
      eventEndDate,
      eventStartDate,
    )

    const newStartDate = new Date(cell.date)
    newStartDate.setHours(
      eventStartDate.getHours(),
      eventStartDate.getMinutes(),
      eventStartDate.getSeconds(),
      eventStartDate.getMilliseconds(),
    )
    const newEndDate = new Date(newStartDate.getTime() + eventDurationMs)

    try {
      await updateEvent({
        ...droppedEvent,
        description: droppedEvent.description || '',
        user: droppedEvent.user || { id: '', name: '' },
        startDate: newStartDate.toISOString(),
        endDate: newEndDate.toISOString(),
      })
      return { moved: true }
    } catch (error) {
      console.error('Failed to move event:', error)
      return { moved: false, error: error }
    }
  }, [cell.date, updateEvent])

  // 🔧 Memoize drop configuration to prevent re-registration
  const dropConfig = useMemo(() => ({
    accept: ItemTypes.EVENT,
    drop: handleDrop,
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [handleDrop])

  const [{ isOver, canDrop }, drop] = useDrop(dropConfig)

  return (
    <div
      ref={drop as unknown as React.RefObject<HTMLDivElement>}
      className={cn(
        'relative',
        // 🎨 CSS-only hover effects (no Motion during drag)
        isOver && canDrop && 'bg-primary/5'
      )}
      style={{
        // 🚀 CSS transforms for performance (no React re-renders)
        transform: isOver && canDrop ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.15s ease-out',
      }}
    >
      {children}

      {/* 🎯 Simple drop indicator - no Motion animations during drag */}
      {isOver && canDrop && (
        <div
          className="absolute inset-1 pointer-events-none border-1 border-dashed border-primary/50 rounded-sm bg-primary/5 flex items-center justify-center"
          style={{
            animation: 'pulse 0.5s ease-in-out infinite'
          }}
        >
        </div>
      )}
    </div>
  )
}
