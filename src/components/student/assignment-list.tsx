'use client'

import React from 'react'
import { Timeline, TimelineItem, TimelineHeader, TimelineContent } from '@/components/ui/timeline-view'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, BookOpen } from 'lucide-react'
import { AssignmentService } from '@/services/assignment-service'
import AssignmentCard from '../assignment-card'
import NoAssignments from '../no-assignments'
import { RecurringInstancesGrid } from '@/components/ui/recurring-instances-grid'
import { Assignment, Note } from '@/types'

interface AssignmentListProps {
  assignments: Assignment[]
  userRole: string
  selectedChildName?: string
  expandedCardId: string | null
  setExpandedCardId: (id: string | null) => void
  selectedInstanceDates: Record<string, string | undefined>
  notes: Note[]
  onToggle: (assignmentId: string, instanceDate?: string) => void
  onNoteCreated: () => void
  onInstanceClick: (assignmentId: string, date: string, dayName: string) => void
}

export function AssignmentList({
  assignments,
  userRole,
  selectedChildName,
  expandedCardId,
  setExpandedCardId,
  selectedInstanceDates,
  notes,
  onToggle,
  onNoteCreated,
  onInstanceClick
}: AssignmentListProps) {
  const { overdue, today, upcoming } = AssignmentService.groupAssignments(assignments)

  if (assignments.length === 0) {
    return (
      <Card className="relative">
        <NoAssignments className="absolute h-full w-full inset-0 z-0" />
        <CardContent className="relative text-center py-40">
          <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
          <p className="text-muted-foreground mb-4">
            {userRole === 'parent'
              ? selectedChildName
                ? `${selectedChildName} doesn't have any assignments yet.`
                : "No assignments have been created yet."
              : "You don't have any assignments yet."
            }
          </p>
          {userRole === 'parent' && (
            <p className="text-sm text-muted-foreground">
              Visit the <strong>Parent Dashboard</strong> to create assignments for your children.
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  const allCompleted = overdue.length === 0 && today.length === 0 && upcoming.length === 0

  if (allCompleted) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground mb-4">
            {userRole === 'parent'
              ? selectedChildName
                ? `${selectedChildName} has completed all their current assignments.`
                : "All current assignments have been completed."
              : "You've completed all your current assignments."
            }
          </p>
          <p className="text-sm text-muted-foreground">
            Great work! Check back later for new assignments.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Timeline>
      {overdue.length > 0 && (
        <TimelineItem dotColor="red">
          <TimelineHeader textColor="red">Overdue</TimelineHeader>
          <TimelineContent>
            <div className={`grid gap-4 transition-grid-cols duration-500 ${expandedCardId ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {overdue.map((assignment, index) => (
                <AssignmentCard
                  showDate={false}
                  image={true}
                  key={assignment.id}
                  assignment={assignment}
                  onToggle={onToggle}
                  getDateLabel={(date: string, completed?: boolean) => AssignmentService.getDateLabel(assignment)}
                  getDateColor={(date: string, completed?: boolean) => AssignmentService.getDateColor(assignment)}
                  imageIndex={index}
                  expandedCardId={expandedCardId}
                  setExpandedCardId={setExpandedCardId}
                  onNoteCreated={onNoteCreated}
                  selectedInstanceDate={selectedInstanceDates[assignment.id]}
                />
              ))}
            </div>
          </TimelineContent>
        </TimelineItem>
      )}

      {today.length > 0 && (
        <TimelineItem dotColor="default">
          <TimelineHeader textColor="default">Today&apos;s Assignments</TimelineHeader>
          <TimelineContent>
            <div className={`grid gap-4 transition-[grid-template-columns] duration-600 ${expandedCardId ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {today.map((assignment, index) => (
                <React.Fragment key={assignment.id}>
                  <AssignmentCard
                    showDate={true}
                    image={true}
                    assignment={assignment}
                    onToggle={onToggle}
                    getDateLabel={(date: string, completed?: boolean) => AssignmentService.getDateLabel(assignment)}
                    getDateColor={(date: string, completed?: boolean) => AssignmentService.getDateColor(assignment)}
                    imageIndex={index + overdue.length}
                    expandedCardId={expandedCardId}
                    setExpandedCardId={setExpandedCardId}
                    onNoteCreated={onNoteCreated}
                    assignmentNotes={notes}
                    selectedInstanceDate={selectedInstanceDates[assignment.id]}
                  />
                  {expandedCardId === assignment.id && (
                    <RecurringInstancesGrid
                      assignment={assignment}
                      imageIndex={index + overdue.length}
                      showImages={true}
                      daysAhead={7}
                      onInstanceClick={(date, dayName) => onInstanceClick(assignment.id, date, dayName)}
                      selectedInstanceDate={selectedInstanceDates[assignment.id]}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </TimelineContent>
        </TimelineItem>
      )}

      {upcoming.length > 0 && (
        <TimelineItem dotColor="default">
          <TimelineHeader textColor="default">Upcoming</TimelineHeader>
          <TimelineContent>
            <div className={`grid gap-4 transition-all duration-500 ${expandedCardId ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {upcoming.map((assignment, index) => (
                <AssignmentCard
                  showDate={true}
                  image={true}
                  key={assignment.id}
                  assignment={assignment}
                  onToggle={onToggle}
                  getDateLabel={(date: string, completed?: boolean) => AssignmentService.getDateLabel(assignment)}
                  getDateColor={(date: string, completed?: boolean) => AssignmentService.getDateColor(assignment)}
                  imageIndex={index + overdue.length + today.length}
                  expandedCardId={expandedCardId}
                  setExpandedCardId={setExpandedCardId}
                  onNoteCreated={onNoteCreated}
                  assignmentNotes={notes}
                  selectedInstanceDate={selectedInstanceDates[assignment.id]}
                />
              ))}
            </div>
          </TimelineContent>
        </TimelineItem>
      )}
    </Timeline>
  )
}
