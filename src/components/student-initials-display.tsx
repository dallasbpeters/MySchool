/**
 * Student Initials Display Component
 * Shows student initials with overflow handling and tooltips
 */

'use client'

import React, { useState, useMemo } from 'react'
import { StudentInitial } from '@/types/calendar-integration'

interface StudentInitialsDisplayProps {
  students: StudentInitial[]
  maxDisplay?: number
  showTooltip?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
  onClick?: (student: StudentInitial) => void
}

export function StudentInitialsDisplay({
  students,
  maxDisplay = 3,
  showTooltip = true,
  size = 'medium',
  className = '',
  onClick
}: StudentInitialsDisplayProps) {
  const [showTooltipState, setShowTooltipState] = useState(false)

  // Validate student data structure
  const validStudents = useMemo(() => {
    if (!students || students.length === 0) {
      return []
    }
    
    return students.filter(student => 
      student && 
      typeof student.studentId === 'string' && 
      typeof student.initials === 'string' && 
      typeof student.displayName === 'string'
    )
  }, [students])

  // Memoize calculations for performance
  const { displayStudents, hasOverflow, overflowCount, sizeClasses, tooltipContent } = useMemo(() => {
    const display = validStudents.slice(0, maxDisplay)
    const overflow = validStudents.length > maxDisplay
    const count = Math.max(0, validStudents.length - maxDisplay)
    const tooltip = validStudents.map(s => s.displayName).join(', ')

    // Size-based styling
    const getSizeClasses = () => {
      switch (size) {
        case 'small':
          return {
            container: 'text-xs',
            badge: 'px-1.5 py-0.5 text-xs',
            overflow: 'px-1 py-0.5 text-xs'
          }
        case 'large':
          return {
            container: 'text-base',
            badge: 'px-3 py-1 text-sm',
            overflow: 'px-2 py-1 text-sm'
          }
        default: // medium
          return {
            container: 'text-sm',
            badge: 'px-2 py-1 text-sm',
            overflow: 'px-1.5 py-0.5 text-sm'
          }
      }
    }

    return {
      displayStudents: display,
      hasOverflow: overflow,
      overflowCount: count,
      sizeClasses: getSizeClasses(),
      tooltipContent: tooltip
    }
  }, [validStudents, maxDisplay, size])

  const handleStudentClick = (student: StudentInitial) => {
    if (onClick) {
      onClick(student)
    }
  }

  // Early return after all hooks are called
  if (validStudents.length === 0) {
    return null
  }

  return (
    <div 
      className={`student-initials-display flex items-center space-x-1 ${sizeClasses.container} ${className}`}
      data-testid="student-initials-display"
    >
      {/* Individual student initials */}
      {displayStudents.map((student) => (
        <span
          key={student.studentId}
          className={`student-initial inline-flex items-center justify-center ${sizeClasses.badge} bg-blue-100 text-blue-800 font-medium rounded-full hover:bg-blue-200 transition-colors ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1' : ''}`}
          onClick={() => handleStudentClick(student)}
          title={showTooltip ? student.displayName : undefined}
          aria-label={`${student.initials} - ${student.displayName}`}
          data-testid={`student-initial-${student.studentId}`}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          onKeyDown={onClick ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleStudentClick(student)
            }
          } : undefined}
        >
          {student.initials}
        </span>
      ))}

      {/* Overflow indicator */}
      {hasOverflow && (
        <span
          className={`overflow-indicator inline-flex items-center justify-center ${sizeClasses.overflow} bg-gray-100 text-gray-600 font-medium rounded-full hover:bg-gray-200 transition-colors cursor-help focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1`}
          title={showTooltip ? `${overflowCount} more: ${validStudents.slice(maxDisplay).map(s => s.displayName).join(', ')}` : undefined}
          aria-label={`${overflowCount} more students assigned`}
          aria-describedby={showTooltip ? 'overflow-tooltip' : undefined}
          data-testid="overflow-indicator"
          tabIndex={0}
          onMouseEnter={() => setShowTooltipState(true)}
          onMouseLeave={() => setShowTooltipState(false)}
          onFocus={() => setShowTooltipState(true)}
          onBlur={() => setShowTooltipState(false)}
        >
          +{overflowCount}
        </span>
      )}

      {/* Tooltip for all names (accessible version) */}
      {showTooltip && (
        <div 
          className="sr-only"
          aria-live="polite"
          data-testid="student-names-list"
        >
          Assigned to: {tooltipContent}
        </div>
      )}

      {/* Visual tooltip for overflow */}
      {showTooltip && hasOverflow && showTooltipState && (
        <div 
          id="overflow-tooltip"
          className="absolute z-50 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg pointer-events-none transform -translate-y-full -translate-x-1/2 left-1/2 top-0 mt-1"
          style={{ top: '-2rem' }}
          data-testid="overflow-tooltip"
          role="tooltip"
          aria-live="polite"
        >
          {validStudents.slice(maxDisplay).map(s => s.displayName).join(', ')}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}

// Utility component for compact display in tight spaces
export function CompactStudentInitials({
  students,
  maxDisplay = 2,
  className = ''
}: Pick<StudentInitialsDisplayProps, 'students' | 'maxDisplay' | 'className'>) {
  return (
    <StudentInitialsDisplay
      students={students}
      maxDisplay={maxDisplay}
      size="small"
      showTooltip={true}
      className={className}
    />
  )
}

// Utility component for detailed display with interaction
export function InteractiveStudentInitials({
  students,
  onStudentClick,
  className = ''
}: Pick<StudentInitialsDisplayProps, 'students' | 'className'> & {
  onStudentClick: (student: StudentInitial) => void
}) {
  return (
    <StudentInitialsDisplay
      students={students}
      maxDisplay={5}
      size="medium"
      showTooltip={true}
      onClick={onStudentClick}
      className={className}
    />
  )
}