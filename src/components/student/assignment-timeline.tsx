'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { AssignmentService } from '@/services/assignment-service'
import AssignmentCard from '../assignment-card'
import { Assignment, Note } from '@/types'

interface AssignmentTimelineProps {
  assignments: Assignment[]
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
  notes,
  onToggle,
  onNoteCreated
}: AssignmentTimelineProps) {
  const pastAssignments = assignments.filter(assignment =>
    AssignmentService.filters.isPast(assignment) || AssignmentService.filters.isToday(assignment)
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

  const sortedAssignments = pastAssignments
    .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())

  const groupedByDate = sortedAssignments.reduce((acc, assignment) => {
    const dateKey = format(new Date(assignment.due_date), 'EEEE, MMMM dd, yyyy')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(assignment)
    return acc
  }, {} as Record<string, Assignment[]>)

  let runningIndex = 0

  return (
    <ol className="relative border-s border-grey-200 dark:border-gray-400">
      {Object.entries(groupedByDate).map(([date, dateAssignments]) => (
        <li key={date} className="mb-10 ms-4">
          <div className="absolute w-3 h-3 block bg-gray-200 rounded-full mt-0.5 -start-1.5 border border-gray-200 dark:border-gray-900 dark:bg-gray-700"></div>
          <time className="block mb-2 text-lg font-medium leading-none text-foreground dark:text-foreground">
            {date}
          </time>
          <p className="text-sm text-muted-foreground mb-4">
            {dateAssignments.length} assignment{dateAssignments.length !== 1 ? 's' : ''}
          </p>
          <div className={`grid gap-4 transition-grid-cols duration-500 ${expandedCardId ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {dateAssignments.map((assignment) => {
              const currentIndex = runningIndex++
              return (
                <AssignmentCard
                  image={false}
                  showDate={false}
                  key={assignment.id}
                  assignment={assignment}
                  onToggle={onToggle}
                  getDateLabel={(date: string, completed?: boolean) => AssignmentService.getDateLabel(assignment)}
                  getDateColor={(date: string, completed?: boolean) => AssignmentService.getDateColor(assignment)}
                  imageIndex={currentIndex}
                  expandedCardId={expandedCardId}
                  setExpandedCardId={setExpandedCardId}
                  onNoteCreated={onNoteCreated}
                  assignmentNotes={notes}
                />
              )
            })}
          </div>
        </li>
      ))}
    </ol>
  )
}
