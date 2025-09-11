/**
 * Integration test for assignment completion toggle functionality
 * Tests the complete flow of marking assignments as complete/incomplete
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock assignment data
const mockAssignment = {
  id: 'assignment-123',
  type: 'assignment',
  title: 'Math Homework Ch. 5',
  dueDate: '2025-09-15',
  assignedStudents: [
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
  ],
  completionStatus: {
    allCompleted: false,
    completedCount: 1,
    totalCount: 2,
    completions: [
      { studentId: 'student1', completed: false },
      { studentId: 'student2', completed: true }
    ]
  }
}

// Mock assignment completion component
const MockAssignmentItem = ({ assignment, currentUserId }: any) => {
  return (
    <div data-testid="assignment-item" className="calendar-assignment">
      <div data-testid="assignment-title">{assignment.title}</div>
      <div data-testid="assignment-initials">
        {assignment.assignedStudents.map((s: any) => s.initials).join(', ')}
      </div>
      
      {/* Show completion controls based on current user */}
      {assignment.assignedStudents.map((student: any) => (
        <div key={student.studentId} data-testid={`completion-control-${student.studentId}`}>
          <label>
            <input
              type="checkbox"
              data-testid={`completion-checkbox-${student.studentId}`}
              defaultChecked={assignment.completionStatus.completions.find(
                (c: any) => c.studentId === student.studentId
              )?.completed}
              disabled={currentUserId !== student.studentId} // Only own assignments
            />
            {student.displayName}
          </label>
        </div>
      ))}
      
      <div 
        data-testid="completion-status"
        data-completion-count={assignment.completionStatus.completedCount}
        data-total-count={assignment.completionStatus.totalCount}
      >
        {assignment.completionStatus.completedCount} of {assignment.completionStatus.totalCount} completed
      </div>
    </div>
  )
}

describe('Assignment Completion Integration', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>
  
  beforeEach(() => {
    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
    global.fetch = mockFetch
  })
  
  afterEach(() => {
    jest.restoreAllMocks()
  })
  
  it('should toggle assignment completion status successfully', async () => {
    // This test MUST FAIL initially - toggle functionality not implemented
    
    const user = userEvent.setup()
    
    // Mock successful toggle API response
    mockFetch.mockImplementation((url: string | URL, options) => {
      const urlString = url.toString()
      
      if (urlString.includes('/toggle') && options?.method === 'POST') {
        const body = JSON.parse(options.body as string)
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            assignmentId: 'assignment-123',
            completed: body.completed,
            completedAt: body.completed ? new Date().toISOString() : undefined
          })
        } as Response)
      }
      
      return Promise.reject(new Error('Unknown endpoint'))
    })
    
    render(<MockAssignmentItem assignment={mockAssignment} currentUserId="student1" />)
    
    // John's checkbox should be unchecked initially
    const johnCheckbox = screen.getByTestId('completion-checkbox-student1')
    expect(johnCheckbox).not.toBeChecked()
    
    // Mary's checkbox should be checked and disabled (not current user)
    const maryCheckbox = screen.getByTestId('completion-checkbox-student2')
    expect(maryCheckbox).toBeChecked()
    expect(maryCheckbox).toBeDisabled()
    
    // Click John's checkbox to complete
    await user.click(johnCheckbox)
    
    // Should call toggle API
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/assignments/assignment-123/toggle'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ completed: true })
        })
      )
    })
    
    // Should update UI optimistically
    expect(johnCheckbox).toBeChecked()
  })
  
  it('should handle unchecking completed assignments', async () => {
    // This test MUST FAIL initially - unchecking not implemented
    
    const user = userEvent.setup()
    
    // Mock assignment where current user has completed
    const completedAssignment = {
      ...mockAssignment,
      completionStatus: {
        ...mockAssignment.completionStatus,
        completions: [
          { studentId: 'student1', completed: true }, // Current user completed
          { studentId: 'student2', completed: true }
        ]
      }
    }
    
    mockFetch.mockImplementation((url: string | URL, options) => {
      if (url.toString().includes('/toggle') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            assignmentId: 'assignment-123',
            completed: false,
            completedAt: undefined
          })
        } as Response)
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
    
    render(<MockAssignmentItem assignment={completedAssignment} currentUserId="student1" />)
    
    const johnCheckbox = screen.getByTestId('completion-checkbox-student1')
    expect(johnCheckbox).toBeChecked()
    
    // Uncheck the assignment
    await user.click(johnCheckbox)
    
    // Should call API with completed: false
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/assignments/assignment-123/toggle'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ completed: false })
        })
      )
    })
    
    expect(johnCheckbox).not.toBeChecked()
  })
  
  it('should update completion status count after toggle', async () => {
    // This test MUST FAIL initially - status count update not implemented
    
    const user = userEvent.setup()
    
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          assignmentId: 'assignment-123',
          completed: true,
          completedAt: new Date().toISOString()
        })
      } as Response)
    })
    
    render(<MockAssignmentItem assignment={mockAssignment} currentUserId="student1" />)
    
    // Initial status: 1 of 2 completed
    const statusElement = screen.getByTestId('completion-status')
    expect(statusElement).toHaveTextContent('1 of 2 completed')
    expect(statusElement).toHaveAttribute('data-completion-count', '1')
    
    // Complete John's assignment
    const johnCheckbox = screen.getByTestId('completion-checkbox-student1')
    await user.click(johnCheckbox)
    
    // Should update to 2 of 2 completed
    await waitFor(() => {
      expect(statusElement).toHaveTextContent('2 of 2 completed')
      expect(statusElement).toHaveAttribute('data-completion-count', '2')
    })
  })
  
  it('should handle API errors gracefully', async () => {
    // This test MUST FAIL initially - error handling not implemented
    
    const user = userEvent.setup()
    
    // Mock API error
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: 'Internal Server Error',
          message: 'Failed to update assignment'
        })
      } as Response)
    })
    
    render(<MockAssignmentItem assignment={mockAssignment} currentUserId="student1" />)
    
    const johnCheckbox = screen.getByTestId('completion-checkbox-student1')
    expect(johnCheckbox).not.toBeChecked()
    
    // Try to complete assignment
    await user.click(johnCheckbox)
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
      expect(screen.getByText(/Failed to update assignment/)).toBeInTheDocument()
    })
    
    // Should revert optimistic update
    expect(johnCheckbox).not.toBeChecked()
  })
  
  it('should handle network errors with retry option', async () => {
    // This test MUST FAIL initially - retry logic not implemented
    
    const user = userEvent.setup()
    
    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    
    render(<MockAssignmentItem assignment={mockAssignment} currentUserId="student1" />)
    
    const johnCheckbox = screen.getByTestId('completion-checkbox-student1')
    await user.click(johnCheckbox)
    
    // Should show retry option
    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
      expect(screen.getByText(/Network error/)).toBeInTheDocument()
    })
    
    // Mock successful retry
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          assignmentId: 'assignment-123',
          completed: true,
          completedAt: new Date().toISOString()
        })
      } as Response)
    })
    
    // Click retry
    const retryButton = screen.getByTestId('retry-button')
    await user.click(retryButton)
    
    // Should succeed on retry
    await waitFor(() => {
      expect(johnCheckbox).toBeChecked()
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
    })
  })
  
  it('should handle recurring assignments with instance dates', async () => {
    // This test MUST FAIL initially - recurring assignment logic not implemented
    
    const user = userEvent.setup()
    
    const recurringAssignment = {
      ...mockAssignment,
      isRecurring: true,
      instanceDate: '2025-09-15'
    }
    
    mockFetch.mockImplementation((url: string | URL, options) => {
      if (url.toString().includes('/toggle') && options?.method === 'POST') {
        const body = JSON.parse(options.body as string)
        expect(body).toHaveProperty('instanceDate', '2025-09-15')
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            assignmentId: 'assignment-123',
            completed: true,
            completedAt: new Date().toISOString()
          })
        } as Response)
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
    
    render(<MockAssignmentItem assignment={recurringAssignment} currentUserId="student1" />)
    
    const johnCheckbox = screen.getByTestId('completion-checkbox-student1')
    await user.click(johnCheckbox)
    
    // Should include instance date in API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/toggle'),
        expect.objectContaining({
          body: JSON.stringify({ 
            completed: true,
            instanceDate: '2025-09-15'
          })
        })
      )
    })
  })
  
  it('should show loading state during API call', async () => {
    // This test MUST FAIL initially - loading states not implemented
    
    const user = userEvent.setup()
    
    // Mock slow API response
    mockFetch.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              assignmentId: 'assignment-123',
              completed: true,
              completedAt: new Date().toISOString()
            })
          } as Response)
        }, 100)
      })
    })
    
    render(<MockAssignmentItem assignment={mockAssignment} currentUserId="student1" />)
    
    const johnCheckbox = screen.getByTestId('completion-checkbox-student1')
    await user.click(johnCheckbox)
    
    // Should show loading indicator
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    expect(johnCheckbox).toBeDisabled() // Prevent double-clicks
    
    // Should clear loading state after response
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
      expect(johnCheckbox).not.toBeDisabled()
    })
  })
})