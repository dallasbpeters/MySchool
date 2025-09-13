import React, { Suspense, useEffect, memo } from 'react'
import { AssignmentService } from '@/services/assignment-service'
import AssignmentCardContainer from '../expanding-card'
import { Assignment } from '@/types'
import EmptyState from '@/components/EmptyState'
import { motion } from 'motion/react'

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
  onNoteCreatedAction?: (childId?: string) => Promise<void>
  onToggleAction?: (assignmentId: string, instanceDate?: string) => void
  selectedChildId?: string | null
}

const AssignmentListComponent: React.FC<AssignmentListProps> = ({
  assignments,
  onInstanceClick: _onInstanceClick,
  notes = [],
  onNoteCreatedAction,
  onToggleAction,
  selectedChildId,
}) => {
  // Debug: Watch for prop changes to ensure re-renders
  useEffect(() => { }, [assignments, notes, onToggleAction, selectedChildId])

  const { overdue, today, upcoming } =
    AssignmentService.groupAssignments(assignments)


  // Check if all sections are empty
  const hasNoAssignments =
    overdue.length === 0 && today.length === 0 && upcoming.length === 0

  if (hasNoAssignments) {
    return (
      <EmptyState
        title="No assignments."
        description="You're all caught up! New assignments will appear here when they're created."
      />
    )
  }

  return (
    <Suspense>
      {overdue.length > 0 && (
        <motion.div layout>
          <motion.h5 className="card-list-title text-red-500">Overdue</motion.h5>
          <AssignmentCardContainer
            image={true}
            assignments={overdue}
            groupId="overdue"
            assignmentNotes={notes}
            onNoteCreatedAction={onNoteCreatedAction}
            onToggleAction={onToggleAction}
            selectedChildId={selectedChildId}
          />
        </motion.div>
      )}

      {today.length > 0 && (
        <motion.div layout>
          <motion.h5 className="card-list-title">
            Today&apos;s Assignments
          </motion.h5>
          <AssignmentCardContainer
            image={true}
            assignments={today}
            groupId="today"
            assignmentNotes={notes}
            onNoteCreatedAction={onNoteCreatedAction}
            onToggleAction={onToggleAction}
            selectedChildId={selectedChildId}
          />
        </motion.div>
      )}

      {upcoming.length > 0 && (
        <motion.div layout>
          <motion.h5 className="card-list-title">Upcoming</motion.h5>
          <AssignmentCardContainer
            size="small"
            image={true}
            assignments={upcoming}
            groupId="upcoming"
            assignmentNotes={notes}
            onNoteCreatedAction={onNoteCreatedAction}
            onToggleAction={onToggleAction}
            selectedChildId={selectedChildId}
          />
        </motion.div>
      )}
    </Suspense>
  )
}

export const AssignmentList = memo(AssignmentListComponent)
