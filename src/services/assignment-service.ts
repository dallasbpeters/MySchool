import { Assignment } from '@/types'

export interface AssignmentFilters {
  isOverdue: (assignment: Assignment) => boolean
  isToday: (assignment: Assignment) => boolean
  isUpcoming: (assignment: Assignment) => boolean
  isPast: (assignment: Assignment) => boolean
}

export interface AssignmentGroups {
  overdue: Assignment[]
  today: Assignment[]
  upcoming: Assignment[]
  past: Assignment[]
}

export class AssignmentService {
  static filters: AssignmentFilters = {
    isOverdue: (assignment: Assignment): boolean => {
      const today = new Date()
      const todayString =
        today.getFullYear() +
        '-' +
        String(today.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(today.getDate()).padStart(2, '0')

      // Compare date strings directly to avoid timezone issues
      if (assignment.due_date >= todayString) {
        return false
      }

      // For recurring assignments, check if any overdue instances are incomplete
      if (assignment.is_recurring) {
        // For recurring assignments, we need to check if there are any overdue instances
        // that haven't been completed. This is more complex and might need a different approach.
        // For now, let's use the simple check for non-recurring assignments
        return !assignment.completed
      }

      // For non-recurring assignments, check if the assignment is completed
      return !assignment.completed
    },

    isToday: (assignment: Assignment): boolean => {
      const today = new Date()
      const todayString =
        today.getFullYear() +
        '-' +
        String(today.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(today.getDate()).padStart(2, '0')

      // Compare date strings directly to avoid timezone issues
      if (assignment.due_date !== todayString) {
        return false
      }

      // For recurring assignments, check if today's instance is completed
      if (assignment.is_recurring) {
        const todayInstanceCompleted =
          assignment.instance_completions?.[todayString]?.completed || false
        return !todayInstanceCompleted
      }

      // For non-recurring assignments, check if the assignment is completed
      return !assignment.completed
    },

    isUpcoming: (assignment: Assignment): boolean => {
      const today = new Date()
      const todayString =
        today.getFullYear() +
        '-' +
        String(today.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(today.getDate()).padStart(2, '0')

      // Compare date strings directly to avoid timezone issues
      if (assignment.due_date <= todayString) {
        return false
      }

      // For recurring assignments, we need to check if there are any upcoming instances
      // that haven't been completed. For now, we'll use a simpler approach.
      if (assignment.is_recurring) {
        // For recurring assignments, if the assignment itself is marked as completed,
        // we might still want to show it if there are future instances.
        // This is a complex case that might need more sophisticated logic.
        // For now, let's show recurring assignments in upcoming regardless of completion
        // since they have multiple instances.
        return true
      }

      // For non-recurring assignments, don't show if already completed
      return !assignment.completed
    },

    isPast: (assignment: Assignment): boolean => {
      const today = new Date()
      const todayString =
        today.getFullYear() +
        '-' +
        String(today.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(today.getDate()).padStart(2, '0')

      // Compare date strings directly to avoid timezone issues
      return assignment.due_date <= todayString
    },
  }

  static groupAssignments(assignments: Assignment[]): AssignmentGroups {
    return {
      overdue: assignments.filter(this.filters.isOverdue),
      today: assignments.filter(this.filters.isToday),
      upcoming: assignments.filter(this.filters.isUpcoming),
      past: assignments.filter(this.filters.isPast),
    }
  }

  static getDateLabel(assignment: Assignment): string {
    const dueDate = new Date(assignment.due_date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    if (this.filters.isOverdue(assignment)) {
      return 'Overdue'
    } else if (this.filters.isToday(assignment)) {
      return 'Due Today'
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      return 'Due Tomorrow'
    } else {
      return `Due ${dueDate.toLocaleDateString()}`
    }
  }

  static getDateColor(assignment: Assignment): string {
    if (this.filters.isOverdue(assignment)) {
      return 'text-red-600'
    } else if (this.filters.isToday(assignment)) {
      return 'text-blue-600'
    } else {
      return 'text-muted-foreground'
    }
  }

  static async toggleAssignment(
    assignmentId: string,
    studentId?: string,
    instanceDate?: string,
    completed?: boolean,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const payload = {
        assignmentId,
        studentId: studentId || undefined,
        instanceDate,
        completed,
      }

      console.log('API Payload:', payload)

      const response = await fetch('/api/assignments/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update assignment')
      }

      return {
        success: true,
        message: data.message || 'Assignment updated successfully',
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update assignment. Please try again.',
      }
    }
  }
}
