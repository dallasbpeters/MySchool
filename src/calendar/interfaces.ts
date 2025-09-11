import type { TEventColor } from '@/calendar/types'
import { CalendarItem, StudentInitial, AssignmentStatus } from '@/types/calendar-integration'

export interface IUser {
  id: string
  name: string
  picturePath?: string // Optional avatar image
}

export interface IEvent {
  id: string
  type?: 'event' | 'assignment'
  startDate: string
  endDate: string
  title: string
  color: TEventColor
  description?: string
  user?: IUser
  isAllDay?: boolean
  // Assignment-specific properties (enhanced)
  isAssignment?: boolean
  assignedStudents?: StudentInitial[] // Now uses proper student initial objects
  completionStatus?: AssignmentStatus
  assignmentId?: string
  dueDate?: string
}

// Legacy compatibility - maps to new CalendarItem interface
export type ICalendarItem = CalendarItem

export interface ICalendarCell {
  day: number
  currentMonth: boolean
  date: Date
}
