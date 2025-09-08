import React, { Suspense, useEffect, memo } from 'react'
import ColorfulText from '@/components/ui/colourful-text'
import {
  Timeline,
  TimelineItem,
  TimelineHeader,
} from '@/components/ui/timeline-view'
import { AssignmentService } from '@/services/assignment-service'
import AssignmentCardContainer from '../expanding-card'
import { Assignment } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import NoAssignments from '@/components/no-assignments'

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
  onInstanceClick: (assignmentId: string, date: string, dayName: string) => void
  isLoading?: boolean
  notes?: Note[]
  onNoteCreated?: () => void
  onToggle?: (assignmentId: string, instanceDate?: string) => void
  selectedChildId?: string | null
}

const AssignmentListComponent: React.FC<AssignmentListProps> = ({
  assignments,
  onInstanceClick: _onInstanceClick,
  isLoading = false,
  notes = [],
  onNoteCreated,
  onToggle,
  selectedChildId,
}) => {
  // Debug: Watch for prop changes to ensure re-renders
  useEffect(() => {
    console.log(
      '🔄 AssignmentList props changed - received',
      assignments.length,
      'assignments',
    )
  }, [assignments, notes, onToggle, selectedChildId])

  const { overdue, today, upcoming } =
    AssignmentService.groupAssignments(assignments)

  console.log('📋 AssignmentList grouped:', {
    overdue: overdue.map((a) => ({ id: a.id, title: a.title })),
    today: today.map((a) => ({ id: a.id, title: a.title })),
    upcoming: upcoming.map((a) => ({ id: a.id, title: a.title })),
  })

  console.log('🔍 AssignmentList filtering details:', {
    overdueCount: overdue.length,
    todayCount: today.length,
    upcomingCount: upcoming.length,
    totalAssignments: assignments.length,
  })

  // Show loading state while assignments are being fetched
  if (isLoading) {
    return (
      <Card className="relative">
        <CardContent className="text-center py-40 text-2xl">
          <ColorfulText text="Loading assignments..." />
        </CardContent>
      </Card>
    )
  }

  // Show "No Assignments" card only when we're not loading AND there are 0 assignments in any category
  if (
    !isLoading &&
    overdue.length === 0 &&
    today.length === 0 &&
    upcoming.length === 0
  ) {
    return (
      <Card className="relative">
        <NoAssignments className="absolute h-full w-full inset-0 z-0" />
        <CardContent className="relative text-center py-40 z-5">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground mb-4">
            &ldquo;You&apos;ve completed all your current assignments.&rdquo;
          </p>
          <p className="text-sm text-muted-foreground">
            Great work! Check back later for new assignments.
          </p>
        </CardContent>
      </Card>
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
