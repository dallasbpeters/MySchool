/**
 * Assignment Calendar Item Component
 * Displays assignments in calendar with student initials (no time display)
 */

'use client'

import React, { useMemo } from 'react'
import { CalendarItem } from '@/types/calendar-integration'
import { formatAssignmentDisplayText, getAssignmentStatusText } from '@/utils/assignment-display'
import { StudentInitialsDisplay } from '@/components/student-initials-display'

interface AssignmentCalendarItemProps {
  assignment: CalendarItem
  onClick?: (assignment: CalendarItem) => void
  onCompletionToggle?: (assignmentId: string, completed: boolean, studentId?: string) => void
  currentUserId?: string
  showCompletionControls?: boolean
  maxInitialsDisplay?: number
  className?: string
}

export function AssignmentCalendarItem({
  assignment,
  onClick,
  onCompletionToggle,
  currentUserId,
  showCompletionControls = false,
  maxInitialsDisplay = 3,
  className = ''
}: AssignmentCalendarItemProps) {
  // Memoize expensive calculations
  const { displayData, statusText, statusClasses, currentUserStudents } = useMemo(() => {
    // Early return for invalid assignment data within memoization
    if (!assignment || !assignment.id || !assignment.title) {
      return {
        displayData: { title: '', subtitle: '' },
        statusText: '',
        statusClasses: '',
        currentUserStudents: []
      }
    }

    const display = formatAssignmentDisplayText(assignment, maxInitialsDisplay)
    
    const status = assignment.assignedStudents && assignment.completionStatus
      ? getAssignmentStatusText(assignment.completionStatus, assignment.assignedStudents)
      : ''

    // Determine CSS classes based on assignment status
    const getStatusClasses = () => {
      const baseClasses = 'calendar-assignment border-l-4 p-2 rounded-r-md cursor-pointer transition-all hover:shadow-md'
      
      switch (assignment.color) {
        case 'red':
          return `${baseClasses} bg-red-50 border-red-500 text-red-900 hover:bg-red-100`
        case 'yellow':
          return `${baseClasses} bg-yellow-50 border-yellow-500 text-yellow-900 hover:bg-yellow-100`
        case 'green':
          return `${baseClasses} bg-green-50 border-green-500 text-green-900 hover:bg-green-100`
        case 'gray':
          return `${baseClasses} bg-gray-50 border-gray-400 text-gray-700 hover:bg-gray-100`
        default:
          return `${baseClasses} bg-blue-50 border-blue-500 text-blue-900 hover:bg-blue-100`
      }
    }

    // Filter students for current user (for completion controls)
    const userStudents = assignment.assignedStudents?.filter(
      student => student.studentId === currentUserId
    ) || []

    return {
      displayData: display,
      statusText: status,
      statusClasses: getStatusClasses(),
      currentUserStudents: userStudents
    }
  }, [assignment, maxInitialsDisplay, currentUserId])

  const handleClick = () => {
    if (onClick) {
      onClick(assignment)
    }
  }

  const handleCompletionToggle = (studentId: string, completed: boolean) => {
    if (onCompletionToggle && assignment.assignmentId) {
      onCompletionToggle(assignment.assignmentId, completed, studentId)
    }
  }

  // Early return for invalid assignment data after hooks
  if (!assignment || !assignment.id || !assignment.title) {
    return null
  }

  return (
    <div
      className={`${statusClasses} ${className}`}
      onClick={handleClick}
      role="listitem"
      aria-label={`${assignment.title} assignment due ${displayData.subtitle}. ${statusText}`}
      aria-describedby={`assignment-${assignment.assignmentId}-description`}
      data-testid="assignment-calendar-item"
      data-assignment-id={assignment.assignmentId}
      data-completion-status={assignment.completionStatus?.allCompleted ? 'complete' : 'incomplete'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      } : undefined}
    >
      {/* Assignment Title */}
      <div className="flex items-start justify-between mb-1">
        <h4 className="font-medium text-sm leading-tight flex-1 mr-2">
          {assignment.title}
        </h4>
        
        {/* Status indicator */}
        {assignment.completionStatus?.allCompleted && (
          <div className="flex-shrink-0">
            <span 
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              aria-label="All students completed"
            >
              ✓
            </span>
          </div>
        )}
      </div>

      {/* Student Initials and Due Date */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          {/* Student Initials Display */}
          {assignment.assignedStudents && assignment.assignedStudents.length > 0 && (
            <StudentInitialsDisplay
              students={assignment.assignedStudents}
              maxDisplay={maxInitialsDisplay}
              showTooltip
              size="small"
            />
          )}
        </div>
        
        {/* Due Date (no time) */}
        <span className="text-xs opacity-75 font-medium">
          {displayData.subtitle}
        </span>
      </div>

      {/* Completion Controls (if enabled) */}
      {showCompletionControls && 
       assignment.completionStatus && 
       currentUserStudents.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          {currentUserStudents.map(student => {
            const completion = assignment.completionStatus?.completions.find(
              c => c.studentId === student.studentId
            )
            
            return (
              <label 
                key={student.studentId}
                className="flex items-center space-x-2 text-xs cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={completion?.completed || false}
                  onChange={(e) => handleCompletionToggle(student.studentId, e.target.checked)}
                  className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-1"
                  aria-label={`Mark assignment complete for ${student.displayName}`}
                  aria-describedby={`completion-status-${student.studentId}`}
                />
                <span>Mark complete</span>
              </label>
            )
          })}
        </div>
      )}

      {/* Screen reader only status information */}
      <div 
        id={`assignment-${assignment.assignmentId}-description`}
        className="sr-only"
        aria-live="polite"
      >
        {statusText}
        {assignment.description && (
          <span>. Description: {assignment.description}</span>
        )}
      </div>
    </div>
  )
}