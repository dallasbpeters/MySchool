'use client'

import React, { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { AssignmentService } from '@/services/assignment-service'
import { Assignment } from '@/types'
import {
  Timeline,
  TimelineItem,
  TimelineHeader,
} from '@/components/ui/timeline-view'

import AssignmentCardContainer from '../expanding-card'

interface AssignmentTimelineProps {
  assignments: Assignment[]
  dotColor?: 'default' | 'red' | 'blue' | 'green'
  textColor?: 'default' | 'red' | 'blue' | 'green'
}

export function AssignmentTimeline({
  assignments,
  dotColor = 'default',
  textColor = 'default',
}: AssignmentTimelineProps) {
  const pastAssignments = assignments.filter(
    (assignment) =>
      AssignmentService.filters.isPast(assignment) ||
      AssignmentService.filters.isToday(assignment),
  )

  if (pastAssignments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No past assignments yet!</p>
        </CardContent>
      </Card>
    )
  }

  const sortedAssignments = pastAssignments.sort(
    (a, b) => parseISO(b.due_date).getTime() - parseISO(a.due_date).getTime(),
  )

  const groupedByDate = sortedAssignments.reduce(
    (acc, assignment) => {
      const dateKey = format(
        parseISO(assignment.due_date),
        'EEEE, MMMM dd, yyyy',
      )
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(assignment)
      return acc
    },
    {} as Record<string, Assignment[]>,
  )

  return (
    <Suspense>
      <Timeline>
        {Object.entries(groupedByDate).map(
          ([date, dateAssignments]) => (
            <TimelineItem key={date} dotColor={dotColor}>
              <TimelineHeader textColor={textColor}>{date}</TimelineHeader>

              <AssignmentCardContainer
                size="xs"
                image={false}
                assignments={dateAssignments}
              />
            </TimelineItem>
          ),
        )}
      </Timeline>
    </Suspense>
  )
}
