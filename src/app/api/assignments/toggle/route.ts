import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { assignmentId, studentId, completed } = await request.json()

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to toggle assignments' },
        { status: 401 }
      )
    }

    // Use provided studentId or default to current user
    const targetStudentId = studentId || user.id

    // If toggling for another student, verify the user is their parent
    if (studentId && studentId !== user.id) {
      const { data: childProfile } = await supabase
        .from('profiles')
        .select('parent_id')
        .eq('id', studentId)
        .single()

      if (!childProfile || childProfile.parent_id !== user.id) {
        return NextResponse.json(
          { error: 'Not authorized to toggle assignments for this student' },
          { status: 403 }
        )
      }
    }

    // Check if assignment already exists for this student
    const { data: existing } = await supabase
      .from('student_assignments')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', targetStudentId)
      .single()

    if (existing) {
      // Update existing assignment
      const { error: updateError } = await supabase
        .from('student_assignments')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('assignment_id', assignmentId)
        .eq('student_id', targetStudentId)

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to update assignment: ${updateError.message}` },
          { status: 500 }
        )
      }
    } else {
      // Create new assignment record
      const { error: insertError } = await supabase
        .from('student_assignments')
        .insert({
          assignment_id: assignmentId,
          student_id: targetStudentId,
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })

      if (insertError) {
        return NextResponse.json(
          { error: `Failed to create assignment record: ${insertError.message}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ 
      success: true,
      message: completed ? 'Assignment marked as complete' : 'Assignment marked as incomplete'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}