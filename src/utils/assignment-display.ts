/**
 * Assignment Display Utility
 * Utilities for formatting and displaying assignments in calendar context
 */

import { 
  CalendarItem, 
  AssignmentDisplay, 
  AssignmentStatus, 
  StudentInitial, 
  TEventColor 
} from '@/types/calendar-integration'
import { Assignment } from '@/types'
import { generateInitialsWithOverflow } from './student-initials'

/**
 * Convert assignment to calendar item for display
 */
export function assignmentToCalendarItem(
  assignment: Assignment,
  assignedStudents: StudentInitial[],
  completionStatus: AssignmentStatus
): CalendarItem {
  const isOverdue = isAssignmentOverdue(assignment.due_date)
  const color = getAssignmentColor(completionStatus, isOverdue)
  
  return {
    id: `assignment-${assignment.id}`,
    type: 'assignment',
    title: assignment.title,
    startDate: assignment.due_date,
    endDate: assignment.due_date,
    isAllDay: true, // Assignments are always all-day (no specific time)
    color,
    description: assignment.content || undefined,
    isAssignment: true,
    assignedStudents,
    completionStatus,
    assignmentId: assignment.id,
    dueDate: assignment.due_date
  }
}

/**
 * Get appropriate color for assignment based on completion status and due date
 */
export function getAssignmentColor(
  completionStatus: AssignmentStatus,
  isOverdue: boolean
): TEventColor {
  // All students completed
  if (completionStatus.allCompleted) {
    return 'gray'
  }
  
  // None completed and overdue
  if (completionStatus.completedCount === 0 && isOverdue) {
    return 'red'
  }
  
  // Partially completed (mixed status)
  if (completionStatus.completedCount > 0 && completionStatus.completedCount < completionStatus.totalCount) {
    return 'yellow' // Could be orange if available
  }
  
  // None completed but not overdue (upcoming)
  return 'yellow'
}

/**
 * Check if assignment is overdue
 */
export function isAssignmentOverdue(dueDate: string): boolean {
  const due = new Date(dueDate)
  const now = new Date()
  
  // Set time to start of day for fair comparison
  due.setHours(23, 59, 59, 999) // End of due date
  now.setHours(0, 0, 0, 0) // Start of current day
  
  return due < now
}

/**
 * Format assignment display text (no time, show initials)
 */
export function formatAssignmentDisplayText(
  assignment: CalendarItem,
  maxInitials: number = 3
): {
  title: string
  subtitle: string
  initialsText: string
  hasOverflow: boolean
  overflowCount: number
} {
  if (!assignment.assignedStudents) {
    return {
      title: assignment.title,
      subtitle: formatDueDate(assignment.dueDate || assignment.startDate),
      initialsText: '',
      hasOverflow: false,
      overflowCount: 0
    }
  }
  
  const displayed = assignment.assignedStudents.slice(0, maxInitials)
  const hasOverflow = assignment.assignedStudents.length > maxInitials
  const overflowCount = Math.max(0, assignment.assignedStudents.length - maxInitials)
  
  const initialsText = displayed.map(s => s.initials).join(', ') + 
    (hasOverflow ? ` +${overflowCount}` : '')
  
  return {
    title: assignment.title,
    subtitle: formatDueDate(assignment.dueDate || assignment.startDate),
    initialsText,
    hasOverflow,
    overflowCount
  }
}

/**
 * Format due date for display (no time)
 */
export function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate)
  const now = new Date()
  
  // Check if it's today
  if (isSameDay(date, now)) {
    return 'Due Today'
  }
  
  // Check if it's tomorrow
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameDay(date, tomorrow)) {
    return 'Due Tomorrow'
  }
  
  // Check if it's yesterday (overdue)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (isSameDay(date, yesterday)) {
    return 'Due Yesterday'
  }
  
  // Format as date only (no time)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

/**
 * Calculate assignment completion status from student assignments
 */
export function calculateAssignmentStatus(
  studentAssignments: Array<{
    student_id: string
    completed: boolean
    completed_at?: string
  }>
): AssignmentStatus {
  const completedCount = studentAssignments.filter(sa => sa.completed).length
  const totalCount = studentAssignments.length
  
  return {
    allCompleted: completedCount === totalCount,
    completedCount,
    totalCount,
    completions: studentAssignments.map(sa => ({
      studentId: sa.student_id,
      completed: sa.completed,
      completedAt: sa.completed_at
    }))
  }
}

/**
 * Get assignment status text for accessibility
 */
export function getAssignmentStatusText(
  completionStatus: AssignmentStatus,
  assignedStudents: StudentInitial[]
): string {
  if (completionStatus.allCompleted) {
    return `All ${completionStatus.totalCount} students completed`
  }
  
  if (completionStatus.completedCount === 0) {
    const studentNames = assignedStudents.map(s => s.displayName).join(', ')
    return `Assigned to ${studentNames} - not yet completed`
  }
  
  return `${completionStatus.completedCount} of ${completionStatus.totalCount} students completed`
}

/**
 * Filter assignments based on user role and permissions
 */
export function filterAssignmentsForUser(
  assignments: CalendarItem[],
  userId: string,
  userRole: 'student' | 'parent' | 'admin',
  studentIds?: string[]
): CalendarItem[] {
  return assignments.filter(assignment => {
    if (userRole === 'admin') {
      return true // Admins see everything
    }
    
    if (userRole === 'student') {
      // Students only see assignments assigned to them
      return assignment.assignedStudents?.some(s => s.studentId === userId) || false
    }
    
    if (userRole === 'parent' && studentIds) {
      // Parents see assignments for their children
      return assignment.assignedStudents?.some(s => studentIds.includes(s.studentId)) || false
    }
    
    return false
  })
}

/**
 * Sort assignments by priority (overdue first, then by due date)
 */
export function sortAssignmentsByPriority(assignments: CalendarItem[]): CalendarItem[] {
  return [...assignments].sort((a, b) => {
    const aOverdue = isAssignmentOverdue(a.dueDate || a.startDate)
    const bOverdue = isAssignmentOverdue(b.dueDate || b.startDate)
    
    // Overdue assignments first
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    
    // Then sort by due date
    const aDate = new Date(a.dueDate || a.startDate)
    const bDate = new Date(b.dueDate || b.startDate)
    
    return aDate.getTime() - bDate.getTime()
  })
}

/**
 * Create assignment display object for kanban/list views
 */
export function createAssignmentDisplay(
  assignment: Assignment,
  assignedStudents: StudentInitial[],
  completionStatus: AssignmentStatus
): AssignmentDisplay {
  return {
    assignmentId: assignment.id,
    title: assignment.title,
    dueDate: assignment.due_date,
    assignedStudents,
    completionStatus,
    isOverdue: isAssignmentOverdue(assignment.due_date),
    category: assignment.category || undefined,
    parentId: assignment.parent_id || ''
  }
}

/**
 * Validate assignment data for display
 */
export function validateAssignmentForDisplay(assignment: Assignment): boolean {
  return !!(
    assignment.id &&
    assignment.title &&
    assignment.due_date &&
    assignment.parent_id
  )
}