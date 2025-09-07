'use client'

import React, { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { AssignmentService } from '@/services/assignment-service'
import TimelineCard from '../timeline-card'
import { Assignment, Note } from '@/types'
import { AnimatePresence } from 'framer-motion'
import {
  Timeline,
  TimelineItem,
  TimelineHeader,
  TimelineContent,
} from '@/components/ui/timeline-view'

interface AssignmentTimelineProps {
  assignments: Assignment[]
  dotColor?: 'default' | 'red' | 'blue' | 'green'
  textColor?: 'default' | 'red' | 'blue' | 'green'
  expandedCardId: string | null
  setExpandedCardId: (id: string | null) => void
  notes: Note[]
  onToggle: (assignmentId: string, instanceDate?: string) => void
  onNoteCreated: () => void
}

export function AssignmentTimeline({
  assignments,
  expandedCardId,
  setExpandedCardId,
  dotColor = 'default',
  textColor = 'default',
  notes,
  onToggle,
  onNoteCreated,
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
    (a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime(),
  )

  const groupedByDate = sortedAssignments.reduce(
    (acc, assignment) => {
      const dateKey = format(
        new Date(assignment.due_date),
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
        {Object.entries(groupedByDate).map(([date, dateAssignments], dateIndex) => (
          <TimelineItem key={date} dotColor={dotColor}>
            <TimelineHeader textColor={textColor}>
              {date}
            </TimelineHeader>

            <TimelineContent>
              <AnimatePresence mode="popLayout">
                {dateAssignments.map((assignment, index) => (
                  <TimelineCard
                    layoutID={`assignment-${assignment.id}`}
                    image={false}
                    showDate={false}
                    key={assignment.id}
                    assignment={assignment}
                    onToggle={onToggle}
                    getDateLabel={() =>
                      AssignmentService.getDateLabel(assignment)
                    }
                    getDateColor={() =>
                      AssignmentService.getDateColor(assignment)
                    }
                    cardIndex={dateIndex * 10 + index}
                    expandedCardId={expandedCardId}
                    setExpandedCardId={setExpandedCardId}
                    onNoteCreated={onNoteCreated}
                    assignmentNotes={notes}
                  />
                ))}
              </AnimatePresence>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Suspense>
  )
}
