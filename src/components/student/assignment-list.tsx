import React, { Suspense } from 'react'
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

interface AssignmentListProps {
  assignments: Assignment[]
  selectedChildName?: string
  onInstanceClick: (assignmentId: string, date: string, dayName: string) => void
  isLoading?: boolean
}

export function AssignmentList({
  assignments,
  onInstanceClick: _onInstanceClick,
  isLoading = false,
}: AssignmentListProps) {
  const { overdue, today, upcoming } =
    AssignmentService.groupAssignments(assignments)

  // Show loading state while assignments are being fetched
  if (isLoading) {
    return (
      <Card className="relative">
        <CardContent className="text-center py-40">
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
            />
          </TimelineItem>
        )}
      </Timeline>
    </Suspense>
  )
}
