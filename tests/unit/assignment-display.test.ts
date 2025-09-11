/**
 * Unit tests for assignment display utility
 * Tests assignment formatting and display logic
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  assignmentToCalendarItem,
  getAssignmentColor,
  isAssignmentOverdue,
  formatAssignmentDisplayText,
  formatDueDate,
  calculateAssignmentStatus,
  getAssignmentStatusText,
  filterAssignmentsForUser,
  sortAssignmentsByPriority,
  createAssignmentDisplay,
  validateAssignmentForDisplay
} from '@/utils/assignment-display'
import { Assignment } from '@/types'
import { StudentInitial, AssignmentStatus, CalendarItem } from '@/types/calendar-integration'

// Mock data
const mockStudentInitials: StudentInitial[] = [
  {
    studentId: 'student1',
    fullName: 'John Doe',
    initials: 'JD',
    displayName: 'John Doe'
  },
  {
    studentId: 'student2',
    fullName: 'Mary Smith',
    initials: 'MS',
    displayName: 'Mary Smith'
  }
]

const mockAssignment: Assignment = {
  id: 'assignment-123',
  title: 'Math Homework',
  content: 'Complete chapter 5 exercises',
  due_date: '2025-09-15T23:59:59.000Z',
  category: 'Math',
  parent_id: 'parent1',
  completed: false,
  links: []
}

const mockCompletionStatus: AssignmentStatus = {
  allCompleted: false,
  completedCount: 1,
  totalCount: 2,
  completions: [
    { studentId: 'student1', completed: false },
    { studentId: 'student2', completed: true }
  ]
}

describe('Assignment Display Utility', () => {
  describe('assignmentToCalendarItem', () => {
    it('should convert assignment to calendar item correctly', () => {
      // This test MUST FAIL initially - conversion function doesn't exist
      const result = assignmentToCalendarItem(
        mockAssignment,
        mockStudentInitials,
        mockCompletionStatus
      )
      
      expect(result.id).toBe('assignment-assignment-123')
      expect(result.type).toBe('assignment')
      expect(result.title).toBe('Math Homework')
      expect(result.startDate).toBe(mockAssignment.due_date)
      expect(result.endDate).toBe(mockAssignment.due_date)
      expect(result.isAllDay).toBe(true) // Assignments are always all-day
      expect(result.description).toBe('Complete chapter 5 exercises')
      expect(result.isAssignment).toBe(true)
      expect(result.assignedStudents).toEqual(mockStudentInitials)
      expect(result.completionStatus).toEqual(mockCompletionStatus)
      expect(result.assignmentId).toBe('assignment-123')
      expect(result.dueDate).toBe(mockAssignment.due_date)
    })
    
    it('should set appropriate color based on completion status', () => {
      // This test MUST FAIL initially - color logic doesn't exist
      
      // Partial completion, not overdue
      const result1 = assignmentToCalendarItem(
        mockAssignment,
        mockStudentInitials,
        mockCompletionStatus
      )
      expect(result1.color).toBe('yellow')
      
      // All completed
      const allCompletedStatus = {
        ...mockCompletionStatus,
        allCompleted: true,
        completedCount: 2
      }
      const result2 = assignmentToCalendarItem(
        mockAssignment,
        mockStudentInitials,
        allCompletedStatus
      )
      expect(result2.color).toBe('gray')
      
      // Overdue assignment
      const overdueAssignment = {
        ...mockAssignment,
        due_date: '2025-09-08T23:59:59.000Z' // Past date
      }
      const noneCompletedStatus = {
        ...mockCompletionStatus,
        completedCount: 0
      }
      const result3 = assignmentToCalendarItem(
        overdueAssignment,
        mockStudentInitials,
        noneCompletedStatus
      )
      expect(result3.color).toBe('red')
    })
  })
  
  describe('getAssignmentColor', () => {
    it('should return gray for all completed assignments', () => {
      // This test MUST FAIL initially - color function doesn't exist
      const allCompletedStatus: AssignmentStatus = {
        allCompleted: true,
        completedCount: 2,
        totalCount: 2,
        completions: []
      }
      
      const color = getAssignmentColor(allCompletedStatus, false)
      expect(color).toBe('gray')
      
      // Should be gray even if overdue
      const colorOverdue = getAssignmentColor(allCompletedStatus, true)
      expect(colorOverdue).toBe('gray')
    })
    
    it('should return red for overdue uncompleted assignments', () => {
      // This test MUST FAIL initially - color function doesn't exist
      const noneCompletedStatus: AssignmentStatus = {
        allCompleted: false,
        completedCount: 0,
        totalCount: 2,
        completions: []
      }
      
      const color = getAssignmentColor(noneCompletedStatus, true)
      expect(color).toBe('red')
    })
    
    it('should return yellow for partially completed assignments', () => {
      // This test MUST FAIL initially - color function doesn't exist
      const partialStatus: AssignmentStatus = {
        allCompleted: false,
        completedCount: 1,
        totalCount: 2,
        completions: []
      }
      
      const color = getAssignmentColor(partialStatus, false)
      expect(color).toBe('yellow')
    })
    
    it('should return yellow for upcoming uncompleted assignments', () => {
      // This test MUST FAIL initially - color function doesn't exist
      const upcomingStatus: AssignmentStatus = {
        allCompleted: false,
        completedCount: 0,
        totalCount: 2,
        completions: []
      }
      
      const color = getAssignmentColor(upcomingStatus, false)
      expect(color).toBe('yellow')
    })
  })
  
  describe('isAssignmentOverdue', () => {
    beforeEach(() => {
      // Mock current date to 2025-09-10
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2025-09-10T12:00:00.000Z'))
    })
    
    afterEach(() => {
      jest.useRealTimers()
    })
    
    it('should correctly identify overdue assignments', () => {
      // This test MUST FAIL initially - overdue function doesn't exist
      const pastDate = '2025-09-08T23:59:59.000Z'
      const futureDate = '2025-09-15T23:59:59.000Z'
      const todayDate = '2025-09-10T23:59:59.000Z'
      
      expect(isAssignmentOverdue(pastDate)).toBe(true)
      expect(isAssignmentOverdue(futureDate)).toBe(false)
      expect(isAssignmentOverdue(todayDate)).toBe(false) // Due today is not overdue
    })
  })
  
  describe('formatAssignmentDisplayText', () => {
    it('should format assignment display text correctly', () => {
      // This test MUST FAIL initially - formatting function doesn't exist
      const calendarItem: CalendarItem = {
        id: 'assignment-123',
        type: 'assignment',
        title: 'Math Homework',
        startDate: '2025-09-15T23:59:59.000Z',
        endDate: '2025-09-15T23:59:59.000Z',
        isAllDay: true,
        color: 'yellow',
        assignedStudents: mockStudentInitials,
        dueDate: '2025-09-15T23:59:59.000Z'
      }
      
      const result = formatAssignmentDisplayText(calendarItem, 3)
      
      expect(result.title).toBe('Math Homework')
      expect(result.initialsText).toBe('JD, MS')
      expect(result.hasOverflow).toBe(false)
      expect(result.overflowCount).toBe(0)
      expect(result.subtitle).toContain('Sep 15') // Formatted due date
    })
    
    it('should handle overflow correctly', () => {
      // This test MUST FAIL initially - overflow handling doesn't exist
      const manyStudents: StudentInitial[] = [
        { studentId: '1', fullName: 'John Doe', initials: 'JD', displayName: 'John Doe' },
        { studentId: '2', fullName: 'Mary Smith', initials: 'MS', displayName: 'Mary Smith' },
        { studentId: '3', fullName: 'Bob Johnson', initials: 'BJ', displayName: 'Bob Johnson' },
        { studentId: '4', fullName: 'Alice Brown', initials: 'AB', displayName: 'Alice Brown' },
        { studentId: '5', fullName: 'Charlie Wilson', initials: 'CW', displayName: 'Charlie Wilson' }
      ]
      
      const calendarItem: CalendarItem = {
        id: 'assignment-123',
        type: 'assignment',
        title: 'Math Homework',
        startDate: '2025-09-15T23:59:59.000Z',
        endDate: '2025-09-15T23:59:59.000Z',
        isAllDay: true,
        color: 'yellow',
        assignedStudents: manyStudents,
        dueDate: '2025-09-15T23:59:59.000Z'
      }
      
      const result = formatAssignmentDisplayText(calendarItem, 3)
      
      expect(result.initialsText).toBe('JD, MS, BJ +2')
      expect(result.hasOverflow).toBe(true)
      expect(result.overflowCount).toBe(2)
    })
    
    it('should handle assignments with no assigned students', () => {
      // This test MUST FAIL initially - edge case handling doesn't exist
      const calendarItem: CalendarItem = {
        id: 'assignment-123',
        type: 'assignment',
        title: 'Math Homework',
        startDate: '2025-09-15T23:59:59.000Z',
        endDate: '2025-09-15T23:59:59.000Z',
        isAllDay: true,
        color: 'yellow',
        assignedStudents: undefined,
        dueDate: '2025-09-15T23:59:59.000Z'
      }
      
      const result = formatAssignmentDisplayText(calendarItem)
      
      expect(result.initialsText).toBe('')
      expect(result.hasOverflow).toBe(false)
      expect(result.overflowCount).toBe(0)
    })
  })
  
  describe('formatDueDate', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2025-09-10T12:00:00.000Z'))
    })
    
    afterEach(() => {
      jest.useRealTimers()
    })
    
    it('should format relative dates correctly', () => {
      // This test MUST FAIL initially - date formatting doesn't exist
      expect(formatDueDate('2025-09-10T23:59:59.000Z')).toBe('Due Today')
      expect(formatDueDate('2025-09-11T23:59:59.000Z')).toBe('Due Tomorrow')
      expect(formatDueDate('2025-09-09T23:59:59.000Z')).toBe('Due Yesterday')
    })
    
    it('should format absolute dates correctly', () => {
      // This test MUST FAIL initially - date formatting doesn't exist
      const result = formatDueDate('2025-09-15T23:59:59.000Z')
      expect(result).toBe('Sep 15')
      
      // Different year should include year
      const nextYear = formatDueDate('2026-09-15T23:59:59.000Z')
      expect(nextYear).toBe('Sep 15, 2026')
    })
  })
  
  describe('calculateAssignmentStatus', () => {
    it('should calculate completion status correctly', () => {
      // This test MUST FAIL initially - calculation function doesn't exist
      const studentAssignments = [
        { student_id: 'student1', completed: false },
        { student_id: 'student2', completed: true },
        { student_id: 'student3', completed: true }
      ]
      
      const result = calculateAssignmentStatus(studentAssignments)
      
      expect(result.allCompleted).toBe(false)
      expect(result.completedCount).toBe(2)
      expect(result.totalCount).toBe(3)
      expect(result.completions).toHaveLength(3)
      
      const completion1 = result.completions.find(c => c.studentId === 'student1')
      const completion2 = result.completions.find(c => c.studentId === 'student2')
      
      expect(completion1?.completed).toBe(false)
      expect(completion2?.completed).toBe(true)
    })
    
    it('should handle all completed case', () => {
      // This test MUST FAIL initially - calculation function doesn't exist
      const studentAssignments = [
        { student_id: 'student1', completed: true, completed_at: '2025-09-08T10:00:00.000Z' },
        { student_id: 'student2', completed: true, completed_at: '2025-09-09T15:00:00.000Z' }
      ]
      
      const result = calculateAssignmentStatus(studentAssignments)
      
      expect(result.allCompleted).toBe(true)
      expect(result.completedCount).toBe(2)
      expect(result.totalCount).toBe(2)
      
      expect(result.completions[0].completedAt).toBe('2025-09-08T10:00:00.000Z')
      expect(result.completions[1].completedAt).toBe('2025-09-09T15:00:00.000Z')
    })
  })
  
  describe('getAssignmentStatusText', () => {
    it('should generate correct status text for accessibility', () => {
      // This test MUST FAIL initially - status text function doesn't exist
      
      // All completed
      const allCompletedStatus: AssignmentStatus = {
        allCompleted: true,
        completedCount: 2,
        totalCount: 2,
        completions: []
      }
      
      const allCompletedText = getAssignmentStatusText(allCompletedStatus, mockStudentInitials)
      expect(allCompletedText).toBe('All 2 students completed')
      
      // None completed
      const noneCompletedStatus: AssignmentStatus = {
        allCompleted: false,
        completedCount: 0,
        totalCount: 2,
        completions: []
      }
      
      const noneCompletedText = getAssignmentStatusText(noneCompletedStatus, mockStudentInitials)
      expect(noneCompletedText).toBe('Assigned to John Doe, Mary Smith - not yet completed')
      
      // Partial completion
      const partialStatus: AssignmentStatus = {
        allCompleted: false,
        completedCount: 1,
        totalCount: 2,
        completions: []
      }
      
      const partialText = getAssignmentStatusText(partialStatus, mockStudentInitials)
      expect(partialText).toBe('1 of 2 students completed')
    })
  })
  
  describe('filterAssignmentsForUser', () => {
    const mockAssignments: CalendarItem[] = [
      {
        id: 'assignment-1',
        type: 'assignment',
        title: 'Math Assignment',
        startDate: '2025-09-15',
        endDate: '2025-09-15',
        isAllDay: true,
        color: 'yellow',
        assignedStudents: [mockStudentInitials[0]] // Only John
      },
      {
        id: 'assignment-2',
        type: 'assignment',
        title: 'Science Assignment',
        startDate: '2025-09-16',
        endDate: '2025-09-16',
        isAllDay: true,
        color: 'yellow',
        assignedStudents: [mockStudentInitials[1]] // Only Mary
      }
    ]
    
    it('should filter assignments for student role', () => {
      // This test MUST FAIL initially - filtering function doesn't exist
      const result = filterAssignmentsForUser(
        mockAssignments,
        'student1',
        'student',
        undefined
      )
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('assignment-1')
    })
    
    it('should filter assignments for parent role', () => {
      // This test MUST FAIL initially - filtering function doesn't exist
      const result = filterAssignmentsForUser(
        mockAssignments,
        'parent1',
        'parent',
        ['student1', 'student2']
      )
      
      expect(result).toHaveLength(2) // Should see both children's assignments
    })
    
    it('should show all assignments for admin role', () => {
      // This test MUST FAIL initially - filtering function doesn't exist
      const result = filterAssignmentsForUser(
        mockAssignments,
        'admin1',
        'admin',
        undefined
      )
      
      expect(result).toHaveLength(2) // Admins see everything
    })
  })
  
  describe('sortAssignmentsByPriority', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2025-09-10T12:00:00.000Z'))
    })
    
    afterEach(() => {
      jest.useRealTimers()
    })
    
    it('should sort overdue assignments first', () => {
      // This test MUST FAIL initially - sorting function doesn't exist
      const assignments: CalendarItem[] = [
        {
          id: 'assignment-future',
          type: 'assignment',
          title: 'Future Assignment',
          startDate: '2025-09-20',
          endDate: '2025-09-20',
          isAllDay: true,
          color: 'yellow',
          dueDate: '2025-09-20'
        },
        {
          id: 'assignment-overdue',
          type: 'assignment',
          title: 'Overdue Assignment',
          startDate: '2025-09-08',
          endDate: '2025-09-08',
          isAllDay: true,
          color: 'red',
          dueDate: '2025-09-08'
        }
      ]
      
      const sorted = sortAssignmentsByPriority(assignments)
      
      expect(sorted[0].id).toBe('assignment-overdue')
      expect(sorted[1].id).toBe('assignment-future')
    })
  })
  
  describe('validateAssignmentForDisplay', () => {
    it('should validate assignment data correctly', () => {
      // This test MUST FAIL initially - validation function doesn't exist
      const validAssignment: Assignment = {
        id: 'assignment-123',
        title: 'Math Homework',
        content: 'Complete exercises',
        due_date: '2025-09-15',
        parent_id: 'parent1',
        completed: false,
        links: []
      }
      
      const invalidAssignment1: Assignment = {
        id: '', // Missing ID
        title: 'Math Homework',
        content: 'Complete exercises',
        due_date: '2025-09-15',
        parent_id: 'parent1',
        completed: false,
        links: []
      }
      
      const invalidAssignment2: Assignment = {
        id: 'assignment-123',
        title: '', // Missing title
        content: 'Complete exercises',
        due_date: '2025-09-15',
        parent_id: 'parent1',
        completed: false,
        links: []
      }
      
      expect(validateAssignmentForDisplay(validAssignment)).toBe(true)
      expect(validateAssignmentForDisplay(invalidAssignment1)).toBe(false)
      expect(validateAssignmentForDisplay(invalidAssignment2)).toBe(false)
    })
  })
})