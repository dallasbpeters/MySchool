import React, { Suspense, useEffect, memo } from 'react'
import {
  Timeline,
  TimelineItem,
  TimelineHeader,
} from '@/components/ui/timeline-view'
import { AssignmentService } from '@/services/assignment-service'
import AssignmentCardContainer from '../expanding-card'
import { Assignment } from '@/types'
import ColourfulText from '../ui/colourful-text'
import EmptyState from '@/components/EmptyState'
import { Card } from '../ui/card'

interface Note {
  id: string
  title: string
  content: string | null
  category: string
  created_at: string
  assignment_id?: string
}

interface AssignmentListProps {
  assignments: Assignment[]
  selectedChildName?: string
  onInstanceClick: (assignmentId: string, date: string) => void
  notes?: Note[]
  onNoteCreated?: (childId?: string) => Promise<void>
  onToggle?: (assignmentId: string, instanceDate?: string) => void
  selectedChildId?: string | null
  isLoading?: boolean
}

const AssignmentListComponent: React.FC<AssignmentListProps> = ({
  assignments,
  onInstanceClick: _onInstanceClick,
  notes = [],
  onNoteCreated,
  onToggle,
  selectedChildId,
  isLoading = false,
}) => {
  // Debug: Watch for prop changes to ensure re-renders
  useEffect(() => { }, [assignments, notes, onToggle, selectedChildId])

  const { overdue, today, upcoming } =
    AssignmentService.groupAssignments(assignments)

  if (isLoading) {
    return (
      <div className="fixed inset-0 h-screen w-screen flex items-center justify-center py-8 text-4xl">
        <ColourfulText text="Loading assignments..." />
      </div>
    )
  }

  // Check if all sections are empty
  const hasNoAssignments = overdue.length === 0 && today.length === 0 && upcoming.length === 0

  if (hasNoAssignments) {
    return (
      <EmptyState title="No assignments." description="You're all caught up! New assignments will appear here when they're created." />
    )
  }

  return (
    <Suspense>
      <Timeline>
        {overdue.length > 0 && (
          <TimelineItem dotColor="red">
            <TimelineHeader textColor="red">Overdue</TimelineHeader>
            <AssignmentCardContainer
              image={true}
              assignments={overdue}
              groupId="overdue"
              assignmentNotes={notes}
              onNoteCreated={onNoteCreated}
              onToggle={onToggle}
              selectedChildId={selectedChildId}
            />
          </TimelineItem>
        )}

        {today.length > 0 && (
          <TimelineItem dotColor="default">
            <TimelineHeader textColor="default">
              Today&apos;s Assignments
            </TimelineHeader>
            <AssignmentCardContainer
              image={true}
              assignments={today}
              groupId="today"
              assignmentNotes={notes}
              onNoteCreated={onNoteCreated}
              onToggle={onToggle}
              selectedChildId={selectedChildId}
            />
          </TimelineItem>
        )}

        {upcoming.length > 0 && (
          <TimelineItem dotColor="default">
            <TimelineHeader textColor="default">Upcoming</TimelineHeader>
            <AssignmentCardContainer
              size="small"
              image={true}
              assignments={upcoming}
              groupId="upcoming"
              assignmentNotes={notes}
              onNoteCreated={onNoteCreated}
              onToggle={onToggle}
              selectedChildId={selectedChildId}
            />
          </TimelineItem>
        )}
      </Timeline>
    </Suspense>
  )
}

export const AssignmentList = memo(AssignmentListComponent)
