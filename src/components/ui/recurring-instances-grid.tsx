'use client'

import { format } from 'date-fns'
import { Card, CardHeader, CardTitle, CardMedia } from '@/components/ui/card'
import Image from 'next/image'
import { images as defaultImages } from '@/components/images'
import { motion } from 'framer-motion'

interface Assignment {
  id: string
  title: string
  is_recurring?: boolean
  recurrence_pattern?: {
    days: string[]
    frequency: 'weekly' | 'daily'
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
  return (
    assignmentDate.getFullYear() === today.getFullYear() &&
    assignmentDate.getMonth() === today.getMonth() &&
    assignmentDate.getDate() === today.getDate()
  )
}

const isDateFuture = (dateStr: string) => {
  const assignmentDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
  assignmentDate.setHours(0, 0, 0, 0)
  return assignmentDate > today
}

// Helper function to generate upcoming instances for recurring assignments
const getRecurringInstances = (
  assignment: Assignment,
  daysAhead: number = 7,
  maxInstances: number = 6,
): Array<{ date: string; dayName: string }> => {
  if (!assignment.is_recurring || !assignment.recurrence_pattern) {
    return []
  }

  const instances: Array<{ date: string; dayName: string }> = []
  const today = new Date()
  const endDate = new Date()
  endDate.setDate(today.getDate() + daysAhead)

  const targetDays = assignment.recurrence_pattern.days.map((day) => {
    const dayMap: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }
    return dayMap[day.toLowerCase()]
  })

  // Generate instances starting from today
  const checkDate = new Date(today)

  while (checkDate <= endDate && instances.length < maxInstances) {
    if (targetDays.includes(checkDate.getDay())) {
      instances.push({
        date: format(checkDate, 'yyyy-MM-dd'),
        dayName: format(checkDate, 'EEE, MMM dd'),
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
  selectedInstanceDate,
}: RecurringInstancesGridProps) => {
  if (!assignment.is_recurring) {
    return null
  }

  const imageArray = images || defaultImages
  const instances = getRecurringInstances(assignment, daysAhead, maxInstances)

  return (
    <div>
      <motion.div
        layout
        initial={{
          opacity: 0,
          y: -10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          delay: (imageIndex || 0) * 0.1,
          layout: { mass: 0.2, damping: 5, stiffness: 50, type: 'spring' },
        }}
        className="fixed p-5 bottom-0 left-0 right-0 z-[500]"
      >
        <div className="flex gap-3 items-center justify-center overflow-y-auto h-full py-4 ">
          {instances.map((instance) => {
            const isSelected = selectedInstanceDate === instance.date
            return (
              <Card
                key={instance.date}
                className={`md:py-0 h-30 border rounded-md transition-colors relative overflow-hidden min-w-60 flex-shrink-0 cursor-pointer ${isSelected
                  ? 'bg-primary/20 border-primary hover:bg-primary/30'
                  : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                onClick={() =>
                  onInstanceClick?.(instance.date, instance.dayName)
                }
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
                      {isDateToday(instance.date)
                        ? 'Today'
                        : isDateFuture(instance.date)
                          ? 'Upcoming'
                          : 'Past'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/60 hover:bg-black/40 transition-colors z-5"></div>
              </Card>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
