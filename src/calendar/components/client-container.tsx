'use client'

import { useMemo } from 'react'
import { isSameDay, parseISO } from 'date-fns'

import { useCalendar } from '@/calendar/contexts/calendar-context'

import { DndProviderWrapper } from '@/calendar/components/dnd/dnd-provider'

import { CalendarHeader } from '@/calendar/components/header/calendar-header'
import { CalendarYearView } from '@/calendar/components/year-view/calendar-year-view'
import { CalendarMonthView } from '@/calendar/components/month-view/calendar-month-view'
import { CalendarAgendaView } from '@/calendar/components/agenda-view/calendar-agenda-view'
import { CalendarDayView } from '@/calendar/components/week-and-day-view/calendar-day-view'
import { CalendarWeekView } from '@/calendar/components/week-and-day-view/calendar-week-view'

import type { TCalendarView } from '@/calendar/types'

interface IProps {
  view: TCalendarView
}

export function ClientContainer({ view }: IProps) {
  const { selectedDate, selectedUserId, events, users, visibleCalendarItems } = useCalendar()

  const filteredEvents = useMemo(() => {
    // Use the enhanced calendar items that include both events and assignments
    // The filtering is already handled by the calendar context based on permissions
    if (visibleCalendarItems && visibleCalendarItems.length > 0) {
      const filtered = visibleCalendarItems.filter((item) => {
        const itemStartDate = parseISO(item.startDate)
        const itemEndDate = parseISO(item.endDate)

        if (view === 'year') {
          const yearStart = new Date(selectedDate.getFullYear(), 0, 1)
          const yearEnd = new Date(
            selectedDate.getFullYear(),
            11,
            31,
            23,
            59,
            59,
            999,
          )
          return itemStartDate <= yearEnd && itemEndDate >= yearStart
        }

        if (view === 'month' || view === 'agenda') {
          const monthStart = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1,
          )
          const monthEnd = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
          )
          return itemStartDate <= monthEnd && itemEndDate >= monthStart
        }

        if (view === 'week') {
          const dayOfWeek = selectedDate.getDay()

          const weekStart = new Date(selectedDate)
          weekStart.setDate(selectedDate.getDate() - dayOfWeek)
          weekStart.setHours(0, 0, 0, 0)

          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          weekEnd.setHours(23, 59, 59, 999)

          return itemStartDate <= weekEnd && itemEndDate >= weekStart
        }

        if (view === 'day') {
          const dayStart = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            0,
            0,
            0,
          )
          const dayEnd = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            23,
            59,
            59,
          )
          return itemStartDate <= dayEnd && itemEndDate >= dayStart
        }

        return false
      })
      
      return filtered
    }

    // Fallback to original events if enhanced calendar items aren't available
    return events.filter((event) => {
      const eventStartDate = parseISO(event.startDate)
      const eventEndDate = parseISO(event.endDate)

      if (view === 'year') {
        const yearStart = new Date(selectedDate.getFullYear(), 0, 1)
        const yearEnd = new Date(
          selectedDate.getFullYear(),
          11,
          31,
          23,
          59,
          59,
          999,
        )
        return eventStartDate <= yearEnd && eventEndDate >= yearStart
      }

      if (view === 'month' || view === 'agenda') {
        const monthStart = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1,
        )
        const monthEnd = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        )
        return eventStartDate <= monthEnd && eventEndDate >= monthStart
      }

      if (view === 'week') {
        const dayOfWeek = selectedDate.getDay()

        const weekStart = new Date(selectedDate)
        weekStart.setDate(selectedDate.getDate() - dayOfWeek)
        weekStart.setHours(0, 0, 0, 0)

        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)

        return eventStartDate <= weekEnd && eventEndDate >= weekStart
      }

      if (view === 'day') {
        const dayStart = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          0,
          0,
          0,
        )
        const dayEnd = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          23,
          59,
          59,
        )
        return eventStartDate <= dayEnd && eventEndDate >= dayStart
      }

      return false
    })
  }, [selectedDate, selectedUserId, events, view, users, visibleCalendarItems])

  const singleDayEvents = filteredEvents.filter((event) => {
    // All-day events are always single day for display purposes
    if (event.isAllDay) return true

    const startDate = parseISO(event.startDate)
    const endDate = parseISO(event.endDate)
    return isSameDay(startDate, endDate)
  })

  const multiDayEvents = filteredEvents.filter((event) => {
    // All-day events are handled as single day events
    if (event.isAllDay) return false

    const startDate = parseISO(event.startDate)
    const endDate = parseISO(event.endDate)
    return !isSameDay(startDate, endDate)
  })

  // For year view, we only care about the start date
  // by using the same date for both start and end,
  // we ensure only the start day will show a dot
  const eventStartDates = useMemo(() => {
    return filteredEvents.map((event) => ({
      ...event,
      endDate: event.startDate,
    }))
  }, [filteredEvents])

  return (
    <div className="bg-background overflow-hidden rounded-xl border">
      <CalendarHeader view={view} events={filteredEvents} />

      <DndProviderWrapper>
        {view === 'day' && (
          <CalendarDayView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === 'month' && (
          <CalendarMonthView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === 'week' && (
          <CalendarWeekView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === 'year' && <CalendarYearView allEvents={eventStartDates} />}
        {view === 'agenda' && (
          <CalendarAgendaView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
      </DndProviderWrapper>
    </div>
  )
}
