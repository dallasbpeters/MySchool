import { Assignment } from '@/types'
import { parseISO } from 'date-fns'
import { 
  CalendarItem, 
  StudentInitial, 
  AssignmentToggleResponse,
  EventsApiResponse 
} from '@/types/calendar-integration'
import { assignmentToCalendarItem, calculateAssignmentStatus } from '@/utils/assignment-display'
import { generateStudentInitials } from '@/utils/student-initials'

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

  /**
   * Check if today is a recurring day for the given assignment
   */
  static isTodayRecurringDay(assignment: Assignment): boolean {
    if (!assignment.is_recurring || !assignment.recurrence_pattern) {
      return false
    }

    const today = new Date()
    const todayString =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0')

    const { days, frequency = 'weekly' } = assignment.recurrence_pattern

    if (frequency === 'daily') {
      return true // Every day is a recurring day for daily tasks
    } else if (frequency === 'weekly') {
      const dayMap: Record<string, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0,
      }

      const todayDayOfWeek = today.getDay()
      return days.some((day) => dayMap[day.toLowerCase()] === todayDayOfWeek)
    }

    return false
  }

  /**
   * Check if a given date is a recurring day for the assignment
   */
  static isDateRecurringDay(assignment: Assignment, date: Date): boolean {
    if (!assignment.is_recurring || !assignment.recurrence_pattern) {
      return false
    }

    const { days, frequency = 'weekly' } = assignment.recurrence_pattern

    if (frequency === 'daily') {
      return true // Every day is a recurring day for daily tasks
    } else if (frequency === 'weekly') {
      const dayMap: Record<string, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0,
      }

      const dateDayOfWeek = date.getDay()
      return days.some((day) => dayMap[day.toLowerCase()] === dateDayOfWeek)
    }

    return false
  }

  static filters: AssignmentFilters = {
    isOverdue: (assignment: Assignment): boolean => {
      const today = new Date()
      const todayString =
        today.getFullYear() +
        '-' +
        String(today.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(today.getDate()).padStart(2, '0')

      // For recurring assignments
      if (assignment.is_recurring) {
        // Check if any past due instances are incomplete
        if (assignment.instance_completions) {
          for (const [instanceDate, completion] of Object.entries(
            assignment.instance_completions,
          )) {
            if (instanceDate < todayString && !completion.completed) {
              return true
            }
          }
        }

        // Check if today is a recurring day and if today's instance is incomplete
        if (AssignmentService.isTodayRecurringDay(assignment)) {
          const todayInstanceCompleted =
            assignment.instance_completions?.[todayString]?.completed || false
          if (!todayInstanceCompleted) {
            return false // Today is a recurring day and it's not completed, so it's not overdue
          }
        }

        // Check if there are any past recurring days that weren't completed
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - 1)

        for (let i = 0; i < 30; i++) { // Check last 30 days
          const dateString =
            checkDate.getFullYear() +
            '-' +
            String(checkDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(checkDate.getDate()).padStart(2, '0')

          if (AssignmentService.isDateRecurringDay(assignment, checkDate)) {
            const instanceCompleted =
              assignment.instance_completions?.[dateString]?.completed || false
            if (!instanceCompleted) {
              return true
            }
          }

          checkDate.setDate(checkDate.getDate() - 1)
        }

        return false
      }

      // For non-recurring assignments, compare due date directly with today
      if (assignment.due_date < todayString) {
        return !assignment.completed
      }

      return false
    },

    isToday: (assignment: Assignment): boolean => {
      // First check if this assignment should be overdue - if so, don't show in today
      if (AssignmentService.filters.isOverdue(assignment)) {
        return false
      }

      const today = new Date()
      const todayString =
        today.getFullYear() +
        '-' +
        String(today.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(today.getDate()).padStart(2, '0')

      // For recurring assignments
      if (assignment.is_recurring) {
        // Check if today is a recurring day
        if (!AssignmentService.isTodayRecurringDay(assignment)) {
          return false
        }

        // Check if today's instance is completed
        const todayInstanceCompleted =
          assignment.instance_completions?.[todayString]?.completed || false
        return !todayInstanceCompleted
      }

      // For non-recurring assignments, compare due date directly with today
      if (assignment.due_date !== todayString) {
        return false
      }

      // For non-recurring assignments, check if the assignment is completed
      return !assignment.completed
    },

    isUpcoming: (assignment: Assignment): boolean => {
      // First check if this assignment should be overdue - if so, don't show in upcoming
      if (AssignmentService.filters.isOverdue(assignment)) {
        return false
      }

      const today = new Date()
      const todayString =
        today.getFullYear() +
        '-' +
        String(today.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(today.getDate()).padStart(2, '0')

      // For recurring assignments
      if (assignment.is_recurring) {
        // If today is a recurring day and not completed, it should be in "today" not "upcoming"
        if (AssignmentService.isTodayRecurringDay(assignment)) {
          const todayInstanceCompleted =
            assignment.instance_completions?.[todayString]?.completed || false
          if (!todayInstanceCompleted) {
            return false // Should show in "today" instead
          }
        }

        // Check if there are any future recurring days that haven't been completed
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() + 1) // Start from tomorrow

        for (let i = 0; i < 30; i++) { // Check next 30 days
          const dateString =
            checkDate.getFullYear() +
            '-' +
            String(checkDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(checkDate.getDate()).padStart(2, '0')

          if (AssignmentService.isDateRecurringDay(assignment, checkDate)) {
            const instanceCompleted =
              assignment.instance_completions?.[dateString]?.completed || false
            if (!instanceCompleted) {
              return true // Found an upcoming incomplete recurring instance
            }
          }

          checkDate.setDate(checkDate.getDate() + 1)
        }

        return false // No upcoming incomplete recurring instances
      }

      // For non-recurring assignments, compare due date directly with today
      if (assignment.due_date <= todayString) {
        return false
      }

      // For non-recurring assignments, don't show if already completed
      return !assignment.completed
    },

    isPast: (assignment: Assignment): boolean => {
      // isPast should only include tasks that are truly in the past but not overdue
      // Overdue tasks are handled by isOverdue filter
      if (AssignmentService.filters.isOverdue(assignment)) {
        return false
      }

      const today = new Date()
      const todayString =
        today.getFullYear() +
        '-' +
        String(today.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(today.getDate()).padStart(2, '0')

      // For recurring assignments, check if all past recurring instances are completed
      if (assignment.is_recurring) {
        let hasIncompletePastInstance = false

        // Check all past recurring days
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - 1) // Start from yesterday

        for (let i = 0; i < 30; i++) { // Check last 30 days
          const dateString =
            checkDate.getFullYear() +
            '-' +
            String(checkDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(checkDate.getDate()).padStart(2, '0')

          if (AssignmentService.isDateRecurringDay(assignment, checkDate)) {
            const instanceCompleted =
              assignment.instance_completions?.[dateString]?.completed || false
            if (!instanceCompleted) {
              hasIncompletePastInstance = true
              break
            }
          }

          checkDate.setDate(checkDate.getDate() - 1)
        }

        return hasIncompletePastInstance
      }

      // For non-recurring assignments, compare due date directly with today
      return assignment.due_date < todayString && !assignment.completed
    },
  }

  static groupAssignments(assignments: Assignment[]): AssignmentGroups {
    // Filter upcoming assignments to only show next incomplete instance for recurring assignments
    const upcomingRaw = assignments.filter(this.filters.isUpcoming)
    const filteredUpcoming = this.filterUpcomingAssignments(upcomingRaw)

    // Further filter to show only one assignment per category (the soonest due)
    const deduplicatedUpcoming = this.deduplicateByCategory(filteredUpcoming)

    const overdue = assignments.filter(this.filters.isOverdue)
    const today = assignments.filter(this.filters.isToday)
    const past = assignments.filter(this.filters.isPast)

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
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    // Always check if overdue first, regardless of assignment type
    if (this.filters.isOverdue(assignment)) {
      return 'Overdue'
    }

    // For recurring assignments
    if (assignment.is_recurring) {
      if (this.filters.isToday(assignment)) {
        return 'Due Today'
      }

      // Find the next upcoming recurring instance
      const nextInstance = this.findNextUpcomingInstance(assignment)
      if (nextInstance) {
        const nextDueDate = parseISO(nextInstance.date)
        if (nextDueDate.toDateString() === tomorrow.toDateString()) {
          return 'Due Tomorrow'
        } else {
          return `Due ${nextDueDate.toLocaleDateString()}`
        }
      }

      return 'No upcoming instances'
    }

    // For non-recurring assignments
    const dueDate = parseISO(assignment.due_date)
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

  static async toggleAssignmentCompletion(
    assignmentId: string,
    completed: boolean,
    instanceDate?: string,
  ): Promise<AssignmentToggleResponse> {
    try {
      const payload = {
        completed,
        instanceDate,
      }

      const response = await fetch(`/api/assignments/${assignmentId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data: AssignmentToggleResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update assignment')
      }

      return data
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to update assignment. Please try again.'
      )
    }
  }

  /**
   * Fetch calendar events and assignments with enhanced display data
   */
  static async fetchCalendarData(
    startDate?: string,
    endDate?: string,
    userId?: string
  ): Promise<EventsApiResponse> {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (userId) params.append('userId', userId)

      const response = await fetch(`/api/events?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data')
      }

      const data: EventsApiResponse = await response.json()
      return data
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to fetch calendar data'
      )
    }
  }

  /**
   * Convert assignments to calendar items for display
   */
  static async convertAssignmentsToCalendarItems(
    assignments: Assignment[],
    studentAssignments: Array<{
      assignment_id: string
      student_id: string
      completed: boolean
      completed_at?: string
    }>,
    studentProfiles: Array<{
      id: string
      first_name?: string
      last_name?: string
      name: string
    }>
  ): Promise<CalendarItem[]> {
    // Create student info map for initial generation
    const studentInfoMap = new Map()
    studentProfiles.forEach(student => {
      const firstName = student.first_name || student.name.split(' ')[0] || 'Student'
      const lastName = student.last_name || student.name.split(' ').slice(1).join(' ') || 'User'
      
      studentInfoMap.set(student.id, {
        id: student.id,
        firstName,
        lastName
      })
    })

    // Group student assignments by assignment ID
    const assignmentCompletionMap = new Map()
    studentAssignments.forEach(sa => {
      if (!assignmentCompletionMap.has(sa.assignment_id)) {
        assignmentCompletionMap.set(sa.assignment_id, [])
      }
      assignmentCompletionMap.get(sa.assignment_id).push({
        studentId: sa.student_id,
        completed: sa.completed,
        completedAt: sa.completed_at
      })
    })

    // Convert each assignment to calendar item
    const calendarItems: CalendarItem[] = []
    
    for (const assignment of assignments) {
      const completions = assignmentCompletionMap.get(assignment.id) || []
      const completionStatus = calculateAssignmentStatus(completions)

      // Get student info for this assignment
      const assignmentStudentInfo = completions.map(completion => 
        studentInfoMap.get(completion.studentId)
      ).filter(Boolean)

      // Generate student initials
      const studentInitials = generateStudentInitials(assignmentStudentInfo)

      // Convert to calendar item
      const calendarItem = assignmentToCalendarItem(
        assignment,
        studentInitials,
        completionStatus
      )

      calendarItems.push(calendarItem)
    }

    return calendarItems
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use toggleAssignmentCompletion instead
   */
  static async toggleAssignment(
    assignmentId: string,
    studentId?: string,
    instanceDate?: string,
    completed?: boolean,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.toggleAssignmentCompletion(
        assignmentId,
        completed ?? true,
        instanceDate
      )
      
      return {
        success: response.success,
        message: 'Assignment updated successfully'
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update assignment'
      }
    }
  }
}