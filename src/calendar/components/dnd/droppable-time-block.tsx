'use client'

import { useMemo, useCallback } from 'react'
import { useDrop } from 'react-dnd'
import { parseISO, differenceInMilliseconds } from 'date-fns'

import { useUpdateEvent } from '@/calendar/hooks/use-update-event'

import { cn } from '@/lib/utils'
import { ItemTypes } from '@/calendar/components/dnd/draggable-event'

import type { IEvent } from '@/calendar/interfaces'

interface DroppableTimeBlockProps {
  date: Date
  hour: number
  minute: number
  children: React.ReactNode
}

export function DroppableTimeBlock({
  date,
  hour,
  minute,
  children,
}: DroppableTimeBlockProps) {
  const { updateEvent } = useUpdateEvent()

  // 🔧 Stabilize drop handler to prevent React DND target errors
  const handleDrop = useCallback(async (item: { event: IEvent }) => {
    const droppedEvent = item.event

    const eventStartDate = parseISO(droppedEvent.startDate)
    const eventEndDate = parseISO(droppedEvent.endDate)

    const eventDurationMs = differenceInMilliseconds(
      eventEndDate,
      eventStartDate,
    )

    const newStartDate = new Date(date)
    newStartDate.setHours(hour, minute, 0, 0)
    const newEndDate = new Date(newStartDate.getTime() + eventDurationMs)

    try {
      await updateEvent({
        ...droppedEvent,
        startDate: newStartDate.toISOString(),
        endDate: newEndDate.toISOString(),
      })
      return { moved: true }
    } catch (error) {
      console.error('Failed to move event:', error)
      return { moved: false, error: error }
    }
  }, [date, hour, minute, updateEvent])

  // 🔧 Memoize drop configuration to prevent re-registration
  const dropConfig = useMemo(() => ({
    accept: ItemTypes.EVENT,
    drop: handleDrop,
    collect: (monitor: any) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [handleDrop])

  const [{ isOver, canDrop }, drop] = useDrop(dropConfig)

  return (
    <div
      ref={drop as unknown as React.RefObject<HTMLDivElement>}
      className={cn('h-[24px]', isOver && canDrop && 'bg-accent/50')}
    >
      {children}
    </div>
  )
}
