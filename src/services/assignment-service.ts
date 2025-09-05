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
      const todayString = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0')

      // Compare date strings directly to avoid timezone issues
      return assignment.due_date < todayString && !assignment.completed
    },

    isToday: (assignment: Assignment): boolean => {
      const today = new Date()
      const todayString = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0')

      // Compare date strings directly to avoid timezone issues
      return assignment.due_date === todayString
    },

    isUpcoming: (assignment: Assignment): boolean => {
      const today = new Date()
      const todayString = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0')

      // Compare date strings directly to avoid timezone issues
      return assignment.due_date > todayString
    },

    isPast: (assignment: Assignment): boolean => {
      const today = new Date()
      const todayString = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0')

      // Compare date strings directly to avoid timezone issues
      return assignment.due_date <= todayString
    }
  }

  static groupAssignments(assignments: Assignment[]): AssignmentGroups {
    return {
      overdue: assignments.filter(this.filters.isOverdue),
      today: assignments.filter(this.filters.isToday),
      upcoming: assignments.filter(this.filters.isUpcoming),
      past: assignments.filter(this.filters.isPast)
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
      return 'text-orange-600'
    } else {
      return 'text-muted-foreground'
    }
  }

  static async toggleAssignment(
    assignmentId: string,
    studentId?: string,
    instanceDate?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/assignments/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          studentId: studentId || undefined,
          instanceDate
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update assignment')
      }

      return { success: true, message: data.message || 'Assignment updated successfully' }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update assignment. Please try again.'
      }
    }
  }
}
