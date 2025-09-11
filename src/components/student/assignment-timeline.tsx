'use client'

import React, { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
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
  onToggle?: (assignmentId: string, instanceDate?: string) => void
  selectedChildId?: string | null
}

export function AssignmentTimeline({
  assignments,
  dotColor = 'default',
  textColor = 'default',
  onToggle,
  selectedChildId,
}: AssignmentTimelineProps) {
  // Include completed assignments and assignments due before today

  const timelineAssignments = assignments.filter((assignment) => {
    const today = new Date()
    const todayString =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0')

    // Show assignments due before today
    const isBeforeToday = assignment.due_date < todayString
    // Show assignments due today
    const isDueToday = assignment.due_date === todayString
    // Show assignments due after today
    const isAfterToday = assignment.due_date > todayString

    const shouldInclude =
      // Show all assignments due before today (past assignments)
      isBeforeToday ||
      // Show completed assignments due today
      (assignment.completed && isDueToday) ||
      // Show completed assignments due after today (future assignments that were completed early)
      (assignment.completed && isAfterToday) ||
      // Show recurring assignments with completed instances
      (assignment.is_recurring &&
        assignment.instance_completions &&
        Object.values(assignment.instance_completions).some(
          (completion) => completion.completed,
        ))

    return shouldInclude
  })

  if (timelineAssignments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No completed assignments yet!</p>
        </CardContent>
      </Card>
    )
  }

  const sortedAssignments = timelineAssignments.sort(
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
        {Object.entries(groupedByDate).map(([date, dateAssignments]) => (
          <TimelineItem key={date} dotColor={dotColor}>
            <TimelineHeader textColor={textColor}>{date}</TimelineHeader>

            <AssignmentCardContainer
              size="xs"
              image={false}
              assignments={dateAssignments}
              onToggle={onToggle}
              selectedChildId={selectedChildId}
            />
          </TimelineItem>
        ))}
      </Timeline>
    </Suspense>
  )
}
