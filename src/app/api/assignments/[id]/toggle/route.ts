/**
 * Assignment completion toggle API endpoint
 * POST /api/assignments/[id]/toggle
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { AssignmentToggleRequest, AssignmentToggleResponse } from '@/types/calendar-integration'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id
    
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

    // Verify the assignment exists and user is assigned to it
    const { data: _studentAssignment, error: checkError } = await supabase
      .from('student_assignments')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Assignment not found or you are not assigned to this assignment' },
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
      // Get the assignment to check if it's recurring
      const { data: assignment } = await supabase
        .from('assignments')
        .select('is_recurring, instance_completions')
        .eq('id', assignmentId)
        .single()

      if (assignment?.is_recurring) {
        // Update instance completions JSON
        const instanceCompletions = assignment.instance_completions || {}
        const instanceKey = body.instanceDate

        if (body.completed) {
          instanceCompletions[instanceKey] = {
            completed: true,
            completed_at: new Date().toISOString(),
            instance_date: body.instanceDate
          }
        } else {
          delete instanceCompletions[instanceKey]
        }

        // Update the assignment's instance completions
        const { error: updateError } = await supabase
          .from('assignments')
          .update({ instance_completions: instanceCompletions })
          .eq('id', assignmentId)

        if (updateError) {
          console.error('Error updating recurring assignment:', updateError)
          return NextResponse.json(
            { error: 'Failed to update assignment completion' },
            { status: 500 }
          )
        }

        const response: AssignmentToggleResponse = {
          success: true,
          assignmentId,
          completed: body.completed,
          completedAt: body.completed ? new Date().toISOString() : undefined
        }

        return NextResponse.json(response)
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
      .eq('student_id', user.id)

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