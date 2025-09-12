/**
 * Calendar Integration Types
 * Enhanced types for calendar and assignment display integration
 */

import { IUser } from '@/calendar/interfaces'

export type TEventColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'gray'

/**
 * Unified calendar item interface that handles both events and assignments
 */
export interface CalendarItem {
  id: string
  type: 'event' | 'assignment'
  title: string
  startDate: string
  endDate: string
  isAllDay: boolean
  color: TEventColor
  description?: string

  // Event-specific fields
  user?: IUser

  // Assignment-specific fields
  isAssignment?: boolean
  assignedStudents?: StudentInitial[]
  completionStatus?: AssignmentStatus
  assignmentId?: string
  dueDate?: string
}

/**
 * Student initial display information
 */
export interface StudentInitial {
  studentId: string
  fullName: string
  initials: string
  displayName: string // For tooltips and aria-labels
}

/**
 * Result of initial generation with overflow handling
 */
export interface InitialGenerationResult {
  initials: StudentInitial[]
  hasOverflow: boolean
  overflowCount: number
  displayInitials: StudentInitial[] // First 3 for display
}

/**
 * Assignment completion status tracking
 */
export interface AssignmentStatus {
  allCompleted: boolean
  completedCount: number
  totalCount: number
  completions: Array<{
    studentId: string
    completed: boolean
    completedAt?: string
  }>
}

/**
 * Assignment display data for calendar rendering
 */
export interface AssignmentDisplay {
  assignmentId: string
  title: string
  dueDate: string
  assignedStudents: StudentInitial[]
  completionStatus: AssignmentStatus
  isOverdue: boolean
  category?: string
  parentId: string // Creator of assignment
}

/**
 * Role-based permissions for calendar and kanban access
 */
export interface RolePermissions {
  userId: string
  role: 'student' | 'parent' | 'admin'
  canViewKanban: boolean
  canCreateAssignments: boolean
  canEditAssignments: boolean
  canEditOwnEvents: boolean
  canEditAllEvents: boolean

  // Student-specific
  studentIds?: string[] // For parent role

  // Filtering
  visibleAssignments: string[]
  visibleEvents: string[]
}

/**
 * Student information for initial generation
 */
export interface StudentInfo {
  id: string
  firstName: string
  lastName: string
  middleName?: string
}

/**
 * Assignment update for real-time sync
 */
export interface AssignmentUpdate {
  assignmentId: string
  type: 'completion' | 'assignment' | 'deletion'
  studentId?: string
  completed?: boolean
  optimistic: boolean
}

/**
 * Calendar state for assignment integration
 */
export interface CalendarState {
  events: CalendarItem[]
  assignments: CalendarItem[]
  allItems: CalendarItem[] // Merged and filtered
  loading: boolean
  error?: string

  // View state
  selectedDate: Date
  viewMode: 'day' | 'week' | 'month' | 'year' | 'agenda'
  selectedUserId: string | 'all'

  // Permissions
  userPermissions: RolePermissions
}

/**
 * Assignment-calendar synchronization state
 */
export interface AssignmentCalendarSync {
  lastSyncTimestamp: number
  pendingUpdates: AssignmentUpdate[]
  optimisticUpdates: Map<string, CalendarItem>
}

/**
 * API response for enhanced events endpoint
 */
export interface EventsApiResponse {
  events: CalendarItem[]
  assignments: CalendarItem[]
  permissions: {
    canCreateEvents: boolean
    canViewKanban: boolean
    canEditAssignments: boolean
    visibleStudentIds: string[]
  }
}

/**
 * API request for student initials generation
 */
export interface StudentInitialsRequest {
  students: StudentInfo[]
}

/**
 * API response for student initials generation
 */
export interface StudentInitialsResponse {
  initials: StudentInitial[]
  hasConflicts: boolean
  conflictResolutions: Array<{
    studentId: string
    originalAttempt: string
    finalInitials: string
  }>
}

/**
 * Assignment completion toggle request
 */
export interface AssignmentToggleRequest {
  completed: boolean
  instanceDate?: string // For recurring assignments
  studentId?: string // For parent/admin users toggling assignments for children
}

/**
 * Assignment completion toggle response
 */
export interface AssignmentToggleResponse {
  success: boolean
  assignmentId: string
  completed: boolean
  completedAt?: string
}
