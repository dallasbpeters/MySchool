import { useMemo } from 'react'
import { CalendarX2 } from 'lucide-react'
import { parseISO, format, endOfDay, startOfDay, isSameMonth, isSameDay, addDays, subDays } from 'date-fns'

import { useCalendar } from '@/calendar/contexts/calendar-context'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar as MiniCalendar } from '@/components/ui/calendar'
import { AgendaDayGroup } from '@/calendar/components/agenda-view/agenda-day-group'

import type { IEvent } from '@/calendar/interfaces'
import type { CalendarItem } from '@/types/calendar-integration'

interface IProps {
  singleDayEvents: (IEvent | CalendarItem)[]
  multiDayEvents: (IEvent | CalendarItem)[]
}

export function CalendarAgendaView({
  singleDayEvents,
  multiDayEvents,
}: IProps) {
  const { selectedDate, setSelectedDate } = useCalendar()

  const eventsByDay = useMemo(() => {
    const allDates = new Map<
      string,
      { date: Date; events: (IEvent | CalendarItem)[]; multiDayEvents: (IEvent | CalendarItem)[] }
    >()

    // Create a date range around the selected date (7 days before to 7 days after, with focus on selected date)
    const dateRange: Date[] = []
    for (let i = -7; i <= 7; i++) {
      dateRange.push(addDays(selectedDate, i))
    }

    // Initialize all dates in range
    dateRange.forEach((date) => {
      const dateKey = format(date, 'yyyy-MM-dd')
      allDates.set(dateKey, {
        date: startOfDay(date),
        events: [],
        multiDayEvents: [],
      })
    })

    singleDayEvents.forEach((event) => {
      const eventDate = parseISO(event.startDate)
      const dateKey = format(eventDate, 'yyyy-MM-dd')
      
      // Only include events within our date range
      if (allDates.has(dateKey)) {
        allDates.get(dateKey)?.events.push(event)
      }
    })

    multiDayEvents.forEach((event) => {
      const eventStart = parseISO(event.startDate)
      const eventEnd = parseISO(event.endDate)

      let currentDate = startOfDay(eventStart)
      const lastDate = endOfDay(eventEnd)

      while (currentDate <= lastDate) {
        const dateKey = format(currentDate, 'yyyy-MM-dd')
        
        // Only include events within our date range
        if (allDates.has(dateKey)) {
          allDates.get(dateKey)?.multiDayEvents.push(event)
        }
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
      }
    })

    // Filter out dates with no events and sort by date
    return Array.from(allDates.values())
      .filter((dayGroup) => dayGroup.events.length > 0 || dayGroup.multiDayEvents.length > 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [singleDayEvents, multiDayEvents, selectedDate])

  const hasAnyEvents = singleDayEvents.length > 0 || multiDayEvents.length > 0

  return (
    <div className="flex h-[800px]">
      <div className="flex-1">
        <ScrollArea className="h-full" type="always">
          <div className="space-y-6 p-4">
            {eventsByDay.map((dayGroup) => (
              <AgendaDayGroup
                key={format(dayGroup.date, 'yyyy-MM-dd')}
                date={dayGroup.date}
                events={dayGroup.events}
                multiDayEvents={dayGroup.multiDayEvents}
              />
            ))}

            {eventsByDay.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
                <CalendarX2 className="size-10" />
                <p className="text-sm md:text-base">
                  No events scheduled around {format(selectedDate, 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="hidden w-70 divide-y border-l md:flex md:flex-col">
        <div className="p-4 flex-shrink-0">
          <div className="w-fit">
            <MiniCalendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border w-full"
              showOutsideDays={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
