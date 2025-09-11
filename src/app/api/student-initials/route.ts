/**
 * Student initials generation API endpoint
 * POST /api/student-initials
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateStudentInitials, validateStudentInfoBatch } from '@/utils/student-initials'
import { StudentInitialsRequest, StudentInitialsResponse } from '@/types/calendar-integration'

export async function POST(request: NextRequest) {
  try {
    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError)
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    // Get the current user for authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: StudentInitialsRequest = await request.json()
    
    if (!body.students || !Array.isArray(body.students)) {
      return NextResponse.json(
        { error: 'students field is required and must be an array' },
        { status: 400 }
      )
    }

    if (body.students.length === 0) {
      return NextResponse.json(
        { error: 'students array cannot be empty' },
        { status: 400 }
      )
    }

    // Validate student data
    const validation = validateStudentInfoBatch(body.students)
    
    if (validation.invalid.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid student data',
          message: `${validation.invalid.length} student records have missing or invalid data`,
          details: validation.invalid
        },
        { status: 400 }
      )
    }

    // Generate initials for valid students
    const initials = generateStudentInitials(validation.valid)
    
    // Check for conflicts (students that needed resolution)
    const conflictResolutions: Array<{
      studentId: string
      originalAttempt: string
      finalInitials: string
    }> = []

    // Simple conflict detection: if any initials end with numbers or have 3+ chars, they were resolved
    initials.forEach(initial => {
      const hasNumericSuffix = /\d+$/.test(initial.initials)
      const hasMiddleInitial = initial.initials.length === 3 && !/\d/.test(initial.initials)
      
      if (hasNumericSuffix || hasMiddleInitial) {
        // Find the student info to generate original attempt
        const studentInfo = validation.valid.find(s => s.id === initial.studentId)
        if (studentInfo) {
          const originalAttempt = studentInfo.firstName.charAt(0).toUpperCase() + 
                                  studentInfo.lastName.charAt(0).toUpperCase()
          
          conflictResolutions.push({
            studentId: initial.studentId,
            originalAttempt,
            finalInitials: initial.initials
          })
        }
      }
    })

    const response: StudentInitialsResponse = {
      initials,
      hasConflicts: conflictResolutions.length > 0,
      conflictResolutions
    }

    return NextResponse.json(response)

  } catch (error: unknown) {
    console.error('Error in POST /api/student-initials:', error)
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}