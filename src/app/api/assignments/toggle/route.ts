import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()


    const { assignmentId, studentId, completed, instanceDate } = body

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
      console.error('Failed to create Supabase client:', clientError)
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

    // Get user profile to determine role
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Determine target student ID
    let targetStudentId: string

    if (userProfile?.role === 'parent') {
      // For parents, studentId must be provided (child's ID)
      if (!studentId) {
        return NextResponse.json(
          { error: 'Parent must specify which child to toggle assignment for' },
          { status: 400 }
        )
      }
      targetStudentId = studentId
    } else {
      // For students, use their own ID
      targetStudentId = user.id
    }



    // If toggling for another student, verify the user is their parent
    if (studentId && studentId !== user.id) {
      const { data: childProfile, error: childError } = await supabase
        .from('profiles')
        .select('parent_id, role')
        .eq('id', studentId)
        .single()



      if (childError) {
        return NextResponse.json(
          { error: `Failed to verify student: ${childError.message}` },
          { status: 400 }
        )
      }

      if (!childProfile || childProfile.parent_id !== user.id) {
        return NextResponse.json(
          { error: 'Not authorized to toggle assignments for this student' },
          { status: 403 }
        )
      }
    }

    // Check if assignment already exists for this student (and instance date if provided)
    let query = supabase
      .from('student_assignments')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', targetStudentId)

    if (instanceDate) {
      query = query.eq('instance_date', instanceDate)
    } else {
      query = query.is('instance_date', null)
    }

    const { data: existing, error: existingError } = await query.single()



    // Handle the case where no existing record is found (this is not an error)
    if (existingError && existingError.code !== 'PGRST116') {

      return NextResponse.json(
        { error: `Failed to check existing assignment: ${existingError.message}` },
        { status: 500 }
      )
    }

    if (existing) {
      // Update existing assignment
      let updateQuery = supabase
        .from('student_assignments')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('assignment_id', assignmentId)
        .eq('student_id', targetStudentId)

      if (instanceDate) {
        updateQuery = updateQuery.eq('instance_date', instanceDate)
      } else {
        updateQuery = updateQuery.is('instance_date', null)
      }

      const { error: updateError } = await updateQuery

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
          completed_at: completed ? new Date().toISOString() : null,
          instance_date: instanceDate || null
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

  } catch (error: unknown) {
    console.error('Error in PATCH /api/assignments/toggle:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
