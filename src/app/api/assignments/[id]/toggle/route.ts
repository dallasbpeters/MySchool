/**
 * Assignment completion toggle API endpoint
 * POST /api/assignments/[id]/toggle
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { AssignmentToggleRequest, AssignmentToggleResponse } from '@/types/calendar-integration'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    const body: AssignmentToggleRequest = await request.json()

    if (typeof body.completed !== 'boolean') {
      return NextResponse.json(
        { error: 'completed field is required and must be a boolean' },
        { status: 400 }
      )
    }

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

    // Get the current user
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

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, parent_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 403 }
      )
    }

    // Determine the target student ID for the assignment
    let targetStudentId = body.studentId

    // If no studentId provided in body, use current user if they're a student
    if (!targetStudentId) {
      if (profile.role === 'student') {
        targetStudentId = user.id
      } else {
        return NextResponse.json(
          { error: 'Student ID is required for parent/admin users' },
          { status: 400 }
        )
      }
    }

    // Verify access permissions
    if (profile.role === 'student') {
      // Students can only toggle their own assignments
      if (targetStudentId !== user.id) {
        return NextResponse.json(
          { error: 'Students can only toggle their own assignments' },
          { status: 403 }
        )
      }
    } else if (profile.role === 'parent') {
      // Parents can only toggle assignments for their children
      const { data: childProfile } = await supabase
        .from('profiles')
        .select('parent_id')
        .eq('id', targetStudentId)
        .single()

      if (!childProfile || childProfile.parent_id !== user.id) {
        return NextResponse.json(
          { error: 'You can only toggle assignments for your children' },
          { status: 403 }
        )
      }
    }
    // Admins can toggle assignments for any student (no additional check needed)

    // Verify the assignment exists and the target student is assigned to it
    const { data: _studentAssignment, error: checkError } = await supabase
      .from('student_assignments')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', targetStudentId)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Assignment not found or student is not assigned to this assignment' },
          { status: 403 }
        )
      }

      console.error('Error checking assignment:', checkError)
      return NextResponse.json(
        { error: 'Failed to verify assignment access' },
        { status: 500 }
      )
    }

    // For recurring assignments, handle instance dates
    if (body.instanceDate) {
      console.log('TOGGLE API - Processing recurring assignment with instanceDate:', body.instanceDate)

      // Get the assignment to check if it's recurring
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select('is_recurring')
        .eq('id', assignmentId)
        .single()

      console.log('TOGGLE API - Assignment query result:', {
        assignmentId,
        assignment,
        assignmentError,
        is_recurring: assignment?.is_recurring
      })

      if (assignmentError) {
        console.error('TOGGLE API - Error fetching assignment:', assignmentError)
        return NextResponse.json(
          { error: 'Assignment not found' },
          { status: 404 }
        )
      }

      if (assignment?.is_recurring) {
        console.log('TOGGLE API - Confirmed recurring assignment, treating as regular assignment for now')
        // Note: instance_completions column doesn't exist in current schema
        // For now, treat recurring assignments the same as regular assignments
        // using the student_assignments table
      } else {
        console.log('TOGGLE API - Assignment is not recurring')
      }
    }

    // For non-recurring assignments, update student_assignments table
    const updateData: {
      completed: boolean
      completed_at?: string | null
    } = {
      completed: body.completed
    }

    if (body.completed) {
      updateData.completed_at = new Date().toISOString()
    } else {
      updateData.completed_at = null
    }

    const { error: updateError } = await supabase
      .from('student_assignments')
      .update(updateData)
      .eq('assignment_id', assignmentId)
      .eq('student_id', targetStudentId)

    if (updateError) {
      console.error('Error updating assignment completion:', updateError)
      return NextResponse.json(
        { error: 'Failed to update assignment completion' },
        { status: 500 }
      )
    }

    const response: AssignmentToggleResponse = {
      success: true,
      assignmentId,
      completed: body.completed,
      completedAt: body.completed ? updateData.completed_at : undefined
    }

    return NextResponse.json(response)

  } catch (error: unknown) {
    console.error('Error in POST /api/assignments/[id]/toggle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
