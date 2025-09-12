import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params
    const { due_date } = await request.json()

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    if (!due_date) {
      return NextResponse.json(
        { error: 'Due date is required' },
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

    // First, get the assignment to check if it's recurring
    const { data: originalAssignment, error: fetchError } = await supabase
      .from('assignments')
      .select('is_recurring, recurrence_pattern, parent_id')
      .eq('id', assignmentId)
      .single()

    if (fetchError) {
      console.error('Error fetching assignment:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch assignment details' },
        { status: 500 }
      )
    }

    if (!originalAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    let updatedAssignments = []

    if (originalAssignment.is_recurring && originalAssignment.recurrence_pattern) {
      // For recurring assignments, update all instances with the same parent_id and recurrence pattern
      const { data: recurringAssignments, error: recurringFetchError } = await supabase
        .from('assignments')
        .select('id, due_date')
        .eq('parent_id', originalAssignment.parent_id)
        .eq('is_recurring', true)
        .not('recurrence_pattern', 'is', null)

      if (recurringFetchError) {
        console.error('Error fetching recurring assignments:', recurringFetchError)
        return NextResponse.json(
          { error: 'Failed to fetch recurring assignments' },
          { status: 500 }
        )
      }

      if (recurringAssignments && recurringAssignments.length > 0) {
        // Calculate the date difference between original due date and new due date
        const originalDate = new Date(recurringAssignments.find((a: { id: string }) => a.id === assignmentId)?.due_date || due_date)
        const newDate = new Date(due_date)
        const daysDifference = Math.round((newDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24))

        // Update all recurring instances by the same date difference
        const updatePromises = recurringAssignments.map(async (assignment) => {
          const currentDate = new Date(assignment.due_date)
          const adjustedDate = new Date(currentDate.getTime() + (daysDifference * 24 * 60 * 60 * 1000))
          const adjustedDateString = adjustedDate.toISOString().split('T')[0]

          return supabase
            .from('assignments')
            .update({ due_date: adjustedDateString })
            .eq('id', assignment.id)
            .select()
        })

        const results = await Promise.all(updatePromises)

        // Check for errors
        const errors = results.filter(result => result.error)
        if (errors.length > 0) {
          console.error('Error updating some recurring assignments:', errors)
          return NextResponse.json(
            { error: 'Failed to update some recurring assignments' },
            { status: 500 }
          )
        }

        updatedAssignments = results.flatMap(result => result.data || [])
      }
    } else {
      // For non-recurring assignments, update only the specific assignment
      const { data: assignmentData, error: updateError } = await supabase
        .from('assignments')
        .update({ due_date })
        .eq('id', assignmentId)
        .select()

      if (updateError) {
        console.error('Error updating assignment due date:', updateError)
        return NextResponse.json(
          { error: 'Failed to update assignment due date' },
          { status: 500 }
        )
      }

      updatedAssignments = assignmentData || []
    }

    if (updatedAssignments.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found or no permission to update' },
        { status: 404 }
      )
    }

    const message = originalAssignment.is_recurring
      ? `Updated ${updatedAssignments.length} recurring assignment instances`
      : 'Assignment due date updated successfully'

    return NextResponse.json({
      success: true,
      assignments: updatedAssignments,
      count: updatedAssignments.length,
      message
    })
  } catch (error: unknown) {
    console.error('Error in PATCH /api/assignments/[id]/due-date:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
