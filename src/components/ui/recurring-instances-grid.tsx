'use client'

import { format } from 'date-fns'
import { Card, CardHeader, CardTitle, CardMedia } from '@/components/ui/card'
import { Repeat } from 'lucide-react'
import Image from 'next/image'

interface Assignment {
  id: string
  title: string
  is_recurring?: boolean
  recurrence_pattern?: {
    days: string[]
    frequency?: 'weekly' | 'daily'
  }
  recurrence_end_date?: string
}

interface RecurringInstancesGridProps {
  assignment: Assignment
  images?: string[]
  imageIndex: number
  showImages?: boolean
  daysAhead?: number
  maxInstances?: number
  onInstanceClick?: (date: string, dayName: string) => void
  selectedInstanceDate?: string
}

// Helper functions for date checking
const isDateToday = (dateStr: string) => {
  const assignmentDate = new Date(dateStr)
  const today = new Date()
  return assignmentDate.getFullYear() === today.getFullYear() &&
    assignmentDate.getMonth() === today.getMonth() &&
    assignmentDate.getDate() === today.getDate()
}

const isDateFuture = (dateStr: string) => {
  const assignmentDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
  assignmentDate.setHours(0, 0, 0, 0)
  return assignmentDate > today
}

// Helper function to generate upcoming instances for recurring assignments
const getRecurringInstances = (assignment: Assignment, daysAhead: number = 7, maxInstances: number = 6): Array<{ date: string, dayName: string }> => {
  if (!assignment.is_recurring || !assignment.recurrence_pattern) {
    return []
  }

  const instances: Array<{ date: string, dayName: string }> = []
  const today = new Date()
  const endDate = new Date()
  endDate.setDate(today.getDate() + daysAhead)

  const targetDays = assignment.recurrence_pattern.days.map(day => {
    const dayMap: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    }
    return dayMap[day.toLowerCase()]
  })

  // Generate instances starting from today
  const checkDate = new Date(today)

  while (checkDate <= endDate && instances.length < maxInstances) {
    if (targetDays.includes(checkDate.getDay())) {
      instances.push({
        date: format(checkDate, 'yyyy-MM-dd'),
        dayName: format(checkDate, 'EEE, MMM dd')
      })
    }
    checkDate.setDate(checkDate.getDate() + 1)
  }

  return instances
}

export const RecurringInstancesGrid = ({
  assignment,
  images,
  imageIndex,
  showImages = true,
  daysAhead = 7,
  maxInstances = 6,
  onInstanceClick,
  selectedInstanceDate
}: RecurringInstancesGridProps) => {
  if (!assignment.is_recurring) {
    return null
  }

  // Default images array if not provided
  const defaultImages = [
    '/wildan-kurniawan-fKdoeUJBh_o-unsplash.svg',
    '/amanda-sala-oHHc3UsNrqs-unsplash.svg',
    '/eva-corbisier-6QxDZxUaScw-unsplash.svg',
    '/evelina-mitev-jV_8Fn1l1ec-unsplash.svg',
    '/gemma-evans-qVzRlSDe8OU-unsplash.svg',
    '/gemma-evans-swmWhdbcb6M-unsplash.svg',
    '/getty-images-F1sG0MZT_Ro-unsplash.svg',
    '/getty-images-pnkJbt9HVBA-unsplash.svg',
    '/lorenzo-mercanti-aKdXUkOY5ek-unsplash.svg',
    '/melanie-villette-lQDNr81EW0w-unsplash.svg',
    '/melanie-villette-Somqo53jwzE-unsplash.svg',
    '/melanie-villette-wI97g9u9XVM-unsplash.svg',
  ]

  const imageArray = images || defaultImages
  const instances = getRecurringInstances(assignment, daysAhead, maxInstances)

  if (instances.length === 0) {
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Upcoming Occurrences
        </h4>
        <p className="text-sm text-muted-foreground italic">
          No upcoming occurrences in the next week
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Repeat className="h-4 w-4" />
        Upcoming Occurrences
      </h4>
      <div className="flex gap-3 overflow-x-auto py-2">
        {instances.map((instance, _index) => {
          const isSelected = selectedInstanceDate === instance.date
          return (
            <Card
              key={instance.date}
              className={`md:py-0 border rounded-md transition-colors relative overflow-hidden min-w-60 flex-shrink-0 cursor-pointer ${isSelected
                ? 'bg-primary/20 border-primary hover:bg-primary/30'
                : 'bg-muted/30 hover:bg-muted/50'
                }`}
              onClick={() => onInstanceClick?.(instance.date, instance.dayName)}
            >
              {showImages && (
                <CardMedia className="-mt-0 md:-mt-0 mb-0">
                  <Image
                    src={imageArray[imageIndex % imageArray.length]}
                    alt={assignment.title}
                    width={1200}
                    height={1200}
                    loading="eager"
                    className="z-0 h-100 object-cover"
                  />
                </CardMedia>
              )}
              <CardHeader className="text-white z-12 bg-transparent absolute bottom-4 left-0 right-0">
                <CardTitle className="flex items-center gap-2">
                  <span>{instance.dayName}</span>
                  <span className="text-xs text-white/80">
                    {isDateToday(instance.date) ? 'Today' :
                      isDateFuture(instance.date) ? 'Upcoming' : 'Past'}
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/60 hover:bg-black/40 transition-colors z-10"></div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
