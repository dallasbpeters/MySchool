/**
 * Integration test for student role-based calendar access
 * Tests that students can only see their own assignments and cannot edit assignment dates
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock student user
const mockStudentUser = {
  id: 'student1',
  role: 'student',
  name: 'John Doe'
}

// Mock assignment data - some assigned to student, some not
const mockAssignmentsData = [
  {
    id: 'assignment-assigned',
    type: 'assignment',
    title: 'Math Homework',
    dueDate: '2025-09-15',
    assignedStudents: [
      {
        studentId: 'student1', // This student
        fullName: 'John Doe',
        initials: 'JD',
        displayName: 'John Doe'
      }
    ],
    completionStatus: {
      allCompleted: false,
      completedCount: 0,
      totalCount: 1,
      completions: [
        { studentId: 'student1', completed: false }
      ]
    }
  },
  {
    id: 'assignment-not-assigned',
    type: 'assignment',
    title: 'Science Project',
    dueDate: '2025-09-20',
    assignedStudents: [
      {
        studentId: 'student2', // Different student
        fullName: 'Mary Smith',
        initials: 'MS',
        displayName: 'Mary Smith'
      }
    ],
    completionStatus: {
      allCompleted: false,
      completedCount: 0,
      totalCount: 1,
      completions: [
        { studentId: 'student2', completed: false }
      ]
    }
  }
]

// Mock calendar component
const MockStudentCalendarContainer = () => {
  return (
    <div data-testid="calendar-container">
      <div data-testid="calendar-view">Student Calendar</div>
      <div data-testid="assignment-assigned" className="calendar-assignment">
        <span data-testid="assignment-title">Math Homework</span>
        <span data-testid="assignment-initials">JD</span>
        <input 
          type="checkbox" 
          data-testid="completion-checkbox" 
          aria-label="Mark assignment complete"
        />
      </div>
      {/* Assignment not assigned to this student should not appear */}
    </div>
  )
}

describe('Student Calendar Access Integration', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>
  
  beforeEach(() => {
    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
    global.fetch = mockFetch
    
    // Mock API responses for student role
    mockFetch.mockImplementation((url: string | URL) => {
      const urlString = url.toString()
      
      if (urlString.includes('/api/events')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            events: [],
            // Only return assignments assigned to this student
            assignments: [mockAssignmentsData[0]], // Only the assigned one
            permissions: {
              canCreateEvents: true, // Students can create their own events
              canViewKanban: false, // Students cannot view kanban
              canEditAssignments: false, // Students cannot edit assignments
              visibleStudentIds: [mockStudentUser.id] // Only themselves
            }
          })
        } as Response)
      }
      
      return Promise.reject(new Error('Unknown API endpoint'))
    })
  })
  
  afterEach(() => {
    jest.restoreAllMocks()
  })
  
  it('should only show assignments assigned to the student', async () => {
    // This test MUST FAIL initially - role-based filtering not implemented
    
    render(<MockStudentCalendarContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('calendar-container')).toBeInTheDocument()
    })
    
    // Should see assigned assignment
    expect(screen.getByTestId('assignment-assigned')).toBeInTheDocument()
    expect(screen.getByText('Math Homework')).toBeInTheDocument()
    
    // Should NOT see assignment assigned to other students
    expect(screen.queryByText('Science Project')).not.toBeInTheDocument()
    expect(screen.queryByTestId('assignment-not-assigned')).not.toBeInTheDocument()
    
    // Should show own initials
    expect(screen.getByTestId('assignment-initials')).toHaveTextContent('JD')
  })
  
  it('should not display kanban access for students', async () => {
    // This test MUST FAIL initially - role-based UI not implemented
    
    render(<MockStudentCalendarContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('calendar-container')).toBeInTheDocument()
    })
    
    // Students should NOT see kanban access button
    expect(screen.queryByTestId('kanban-access-button')).not.toBeInTheDocument()
    
    // Students should NOT see assignment creation button
    expect(screen.queryByTestId('create-assignment-button')).not.toBeInTheDocument()
    
    // Students should NOT see assignment edit buttons
    expect(screen.queryByTestId('edit-assignment-button')).not.toBeInTheDocument()
  })
  
  it('should allow students to toggle their own assignment completion', async () => {
    // This test MUST FAIL initially - completion toggle not implemented
    
    const user = userEvent.setup()
    
    // Mock the toggle API
    mockFetch.mockImplementation((url: string | URL, options) => {
      const urlString = url.toString()
      
      if (urlString.includes('/toggle') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            assignmentId: 'assignment-assigned',
            completed: true,
            completedAt: new Date().toISOString()
          })
        } as Response)
      }
      
      // Default events API
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          events: [],
          assignments: [mockAssignmentsData[0]],
          permissions: {
            canCreateEvents: true,
            canViewKanban: false,
            canEditAssignments: false,
            visibleStudentIds: [mockStudentUser.id]
          }
        })
      } as Response)
    })
    
    render(<MockStudentCalendarContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('completion-checkbox')).toBeInTheDocument()
    })
    
    const checkbox = screen.getByTestId('completion-checkbox')
    expect(checkbox).not.toBeChecked()
    
    // Click to complete assignment
    await user.click(checkbox)
    
    // Should call toggle API
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/assignments/assignment-assigned/toggle'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ completed: true })
        })
      )
    })
    
    // Should update UI
    expect(checkbox).toBeChecked()
  })
  
  it('should not allow students to edit assignment due dates', async () => {
    // This test MUST FAIL initially - edit restrictions not implemented
    
    const user = userEvent.setup()
    
    render(<MockStudentCalendarContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('assignment-assigned')).toBeInTheDocument()
    })
    
    const assignmentItem = screen.getByTestId('assignment-assigned')
    
    // Try to interact with due date (should not be editable)
    const dueDateElement = screen.getByText(/Sep 15/)
    
    // Should not have edit functionality
    expect(dueDateElement).not.toHaveAttribute('contenteditable')
    expect(dueDateElement).not.toHaveClass('editable')
    
    // Click should not enable editing
    await user.click(dueDateElement)
    
    // Should not show date picker or edit controls
    expect(screen.queryByTestId('date-picker')).not.toBeInTheDocument()
    expect(screen.queryByTestId('edit-due-date')).not.toBeInTheDocument()
  })
  
  it('should allow students to create their own events', async () => {
    // This test MUST FAIL initially - event creation for students not implemented
    
    const user = userEvent.setup()
    
    render(<MockStudentCalendarContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('calendar-container')).toBeInTheDocument()
    })
    
    // Students should see "Create Event" button (for their own events)
    const createEventButton = screen.getByTestId('create-event-button')
    expect(createEventButton).toBeInTheDocument()
    
    await user.click(createEventButton)
    
    // Should open event creation dialog
    await waitFor(() => {
      expect(screen.getByTestId('create-event-dialog')).toBeInTheDocument()
    })
    
    // Should allow setting title and time (unlike assignments)
    expect(screen.getByTestId('event-title-input')).toBeInTheDocument()
    expect(screen.getByTestId('event-time-input')).toBeInTheDocument()
  })
  
  it('should show assignment completion status clearly', async () => {
    // This test MUST FAIL initially - status display not implemented
    
    render(<MockStudentCalendarContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('assignment-assigned')).toBeInTheDocument()
    })
    
    const assignmentItem = screen.getByTestId('assignment-assigned')
    
    // Should show completion status for uncompleted assignment
    expect(assignmentItem).toHaveAttribute('data-completion-status', 'incomplete')
    expect(assignmentItem).toHaveClass('assignment-incomplete')
    
    // Should show appropriate color coding
    expect(assignmentItem).toHaveClass('assignment-yellow') // Due soon
  })
  
  it('should handle overdue assignments with proper visual indicators', async () => {
    // This test MUST FAIL initially - overdue handling not implemented
    
    // Mock overdue assignment
    const overdueAssignment = {
      ...mockAssignmentsData[0],
      dueDate: '2025-09-08', // Past date
      id: 'assignment-overdue'
    }
    
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          events: [],
          assignments: [overdueAssignment],
          permissions: {
            canCreateEvents: true,
            canViewKanban: false,
            canEditAssignments: false,
            visibleStudentIds: [mockStudentUser.id]
          }
        })
      } as Response)
    })
    
    render(<MockStudentCalendarContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('assignment-assigned')).toBeInTheDocument()
    })
    
    const assignmentItem = screen.getByTestId('assignment-assigned')
    
    // Should show overdue styling
    expect(assignmentItem).toHaveClass('assignment-overdue')
    expect(assignmentItem).toHaveClass('assignment-red')
    
    // Should show overdue text
    expect(screen.getByText(/overdue/i)).toBeInTheDocument()
  })
  
  it('should provide accessible navigation for screen readers', async () => {
    // This test MUST FAIL initially - accessibility not implemented
    
    render(<MockStudentCalendarContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('assignment-assigned')).toBeInTheDocument()
    })
    
    const assignmentItem = screen.getByTestId('assignment-assigned')
    
    // Should have proper ARIA labels
    expect(assignmentItem).toHaveAttribute('role', 'listitem')
    expect(assignmentItem).toHaveAttribute('aria-label', 
      expect.stringContaining('Math Homework assignment due September 15')
    )
    
    // Completion checkbox should have proper label
    const checkbox = screen.getByTestId('completion-checkbox')
    expect(checkbox).toHaveAttribute('aria-label', 'Mark assignment complete')
    
    // Should be keyboard accessible
    checkbox.focus()
    expect(checkbox).toHaveFocus()
  })
})