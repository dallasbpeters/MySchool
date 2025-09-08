import { Assignment } from '@/types'
import { parseISO } from 'date-fns'

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

      // For recurring assignments, check if any past due instances are incomplete
      if (assignment.is_recurring && assignment.instance_completions) {
        // Check if there are any overdue instances that haven't been completed
        for (const [instanceDate, completion] of Object.entries(
          assignment.instance_completions,
        )) {
          if (instanceDate < todayString && !completion.completed) {
            return true
          }
        }
        // If no overdue incomplete instances found, not overdue
        return false
      }

      // For non-recurring assignments or recurring without instance data
      // Compare due date directly with today
      if (assignment.due_date < todayString) {
        return !assignment.completed
      }

      return false
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
        console.log(
          `❌ Assignment ${assignment.id} (${assignment.title}) filtered out: due_date ${assignment.due_date} <= today ${todayString}`,
        )
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
        console.log(
          `✅ Recurring assignment ${assignment.id} (${assignment.title}) included in upcoming (completed: ${assignment.completed})`,
        )
        return true
      }

      // For non-recurring assignments, don't show if already completed
      const isIncluded = !assignment.completed
      console.log(
        `${isIncluded ? '✅' : '❌'} Non-recurring assignment ${assignment.id} (${assignment.title}) ${isIncluded ? 'included' : 'excluded'} from upcoming (completed: ${assignment.completed})`,
      )
      return isIncluded
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
    console.log(
      '🔄 groupAssignments called with assignments:',
      assignments.map((a) => ({
        id: a.id,
        title: a.title,
        completed: a.completed,
      })),
    )

    // Filter upcoming assignments to only show next incomplete instance for recurring assignments
    const upcomingRaw = assignments.filter(this.filters.isUpcoming)
    console.log(
      '📅 Raw upcoming assignments:',
      upcomingRaw.map((a) => ({
        id: a.id,
        title: a.title,
        completed: a.completed,
      })),
    )

    const filteredUpcoming = this.filterUpcomingAssignments(upcomingRaw)
    console.log(
      '🎯 Filtered upcoming assignments:',
      filteredUpcoming.map((a) => ({
        id: a.id,
        title: a.title,
        completed: a.completed,
      })),
    )

    // Further filter to show only one assignment per category (the soonest due)
    const deduplicatedUpcoming = this.deduplicateByCategory(filteredUpcoming)
    console.log(
      '🔄 Deduplicated upcoming assignments:',
      deduplicatedUpcoming.map((a) => ({
        id: a.id,
        title: a.title,
        completed: a.completed,
      })),
    )

    const overdue = assignments.filter(this.filters.isOverdue)
    const today = assignments.filter(this.filters.isToday)
    const past = assignments.filter(this.filters.isPast)

    console.log('📊 Final grouping:', {
      overdue: overdue.map((a) => ({
        id: a.id,
        title: a.title,
        completed: a.completed,
      })),
      today: today.map((a) => ({
        id: a.id,
        title: a.title,
        completed: a.completed,
      })),
      upcoming: deduplicatedUpcoming.map((a) => ({
        id: a.id,
        title: a.title,
        completed: a.completed,
      })),
      past: past.map((a) => ({
        id: a.id,
        title: a.title,
        completed: a.completed,
      })),
    })

    return {
      overdue,
      today,
      upcoming: deduplicatedUpcoming,
      past,
    }
  }

  /**
   * For recurring assignments, only show the next upcoming instance that hasn't been completed.
   * For non-recurring assignments, return as-is.
   */
  static filterUpcomingAssignments(assignments: Assignment[]): Assignment[] {
    return assignments
      .map((assignment) => {
        if (!assignment.is_recurring) {
          return assignment
        }

        // For recurring assignments, find the next upcoming instance
        const nextInstance = this.findNextUpcomingInstance(assignment)
        if (nextInstance) {
          // Return the assignment with the next due date
          return {
            ...assignment,
            due_date: nextInstance.date,
            next_due_date: nextInstance.date,
          }
        }

        // If no upcoming instances found, don't include this assignment
        return null
      })
      .filter((assignment): assignment is Assignment => assignment !== null)
  }

  /**
   * Find the next upcoming incomplete instance for a recurring assignment
   */
  static findNextUpcomingInstance(
    assignment: Assignment,
  ): { date: string; isCompleted: boolean } | null {
    if (!assignment.is_recurring || !assignment.recurrence_pattern) {
      return null
    }

    const today = new Date()

    const { days, frequency = 'weekly' } = assignment.recurrence_pattern

    // Generate upcoming dates based on recurrence pattern
    let upcomingInstances: string[] = []

    if (frequency === 'daily') {
      // For daily recurrence, generate next 30 days
      for (let i = 1; i <= 30; i++) {
        const futureDate = new Date(today)
        futureDate.setDate(today.getDate() + i)
        const dateString =
          futureDate.getFullYear() +
          '-' +
          String(futureDate.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(futureDate.getDate()).padStart(2, '0')
        upcomingInstances.push(dateString)
      }
    } else if (frequency === 'weekly') {
      // For weekly recurrence, generate dates for the specified days of the week
      const dayMap: Record<string, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0,
      }

      // Generate dates for the next 12 weeks
      for (let week = 0; week < 12; week++) {
        days.forEach((day) => {
          const targetDayOfWeek = dayMap[day.toLowerCase()]
          if (targetDayOfWeek !== undefined) {
            const futureDate = new Date(today)
            futureDate.setDate(
              today.getDate() +
              week * 7 +
              ((targetDayOfWeek - today.getDay() + 7) % 7),
            )

            // If the calculated date is today or in the past, skip to next week
            if (futureDate <= today) {
              futureDate.setDate(futureDate.getDate() + 7)
            }

            const dateString =
              futureDate.getFullYear() +
              '-' +
              String(futureDate.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(futureDate.getDate()).padStart(2, '0')
            upcomingInstances.push(dateString)
          }
        })
      }
    }

    // Check if assignment has an end date
    if (assignment.recurrence_end_date) {
      const endDate = assignment.recurrence_end_date
      upcomingInstances = upcomingInstances.filter((date) => date <= endDate)
    }

    // Find the first upcoming instance that hasn't been completed
    for (const date of upcomingInstances) {
      const isCompleted =
        assignment.instance_completions?.[date]?.completed || false
      if (!isCompleted) {
        return { date, isCompleted: false }
      }
    }

    return null // No upcoming incomplete instances found
  }

  /**
   * Deduplicate assignments by category, keeping only the soonest due assignment per category
   */
  static deduplicateByCategory(assignments: Assignment[]): Assignment[] {
    const categoryMap = new Map<string, Assignment[]>()

    // Group assignments by category
    assignments.forEach((assignment) => {
      const category = assignment.category || 'Uncategorized'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, [])
      }
      categoryMap.get(category)!.push(assignment)
    })

    // For each category, keep only the assignment with the soonest due date
    const deduplicated: Assignment[] = []

    categoryMap.forEach((categoryAssignments) => {
      if (categoryAssignments.length === 1) {
        // Only one assignment in this category
        deduplicated.push(categoryAssignments[0])
      } else {
        // Multiple assignments in this category - find the soonest due
        const soonestAssignment = categoryAssignments.reduce(
          (soonest, current) => {
            if (!soonest) return current

            // Compare due dates
            if (current.due_date < soonest.due_date) {
              return current
            }

            return soonest
          },
        )

        deduplicated.push(soonestAssignment)
      }
    })

    // Sort the final result by due date (soonest first)
    return deduplicated.sort((a, b) => a.due_date.localeCompare(b.due_date))
  }

  static getDateLabel(assignment: Assignment): string {
    const dueDate = parseISO(assignment.due_date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    // Always check if overdue first, regardless of assignment type
    if (this.filters.isOverdue(assignment)) {
      return 'Overdue'
    }

    // For recurring assignments that show next instance, show contextual labels
    if (assignment.is_recurring && assignment.next_due_date) {
      if (this.filters.isToday(assignment)) {
        return 'Due Today'
      } else if (dueDate.toDateString() === tomorrow.toDateString()) {
        return 'Due Tomorrow'
      } else {
        return `Due ${dueDate.toLocaleDateString()}`
      }
    }

    // For non-recurring assignments or recurring without next_due_date
    if (this.filters.isToday(assignment)) {
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
      return 'text-foreground'
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

      console.log('🚀 toggleAssignment payload:', payload)

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
