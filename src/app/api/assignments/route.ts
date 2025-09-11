import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/auth/session-middleware'
import type { Assignment } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const childId = url.searchParams.get('childId')

    // Use session-based authentication
    const { user, error: authError } = await validateAuth(request)
    
    if (authError || !user) {
      return NextResponse.json({ assignments: [], error: 'Authentication failed' })
    }

    let supabase
    try {
      supabase = await createClient()
    } catch {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 },
      )
    }

    // Determine which parent's assignments to fetch and which student to view as
    // For admins, we use the user.id as parentId but won't filter by it later
    const parentId =
      user.role === 'parent'
        ? user.id
        : user.role === 'admin'
          ? user.id
          : user.parent_id
    const studentId = childId || user.id

    // If parent is requesting child view, verify the child belongs to them
    if (childId && user.role === 'parent') {
      const { data: childProfile } = await supabase
        .from('profiles')
        .select('parent_id')
        .eq('id', childId)
        .single()

      if (!childProfile || childProfile.parent_id !== user.id) {
        return NextResponse.json({
          assignments: [],
          error: 'Child not found or not authorized',
        })
      }
    }

    // Get assignments based on context:
    // - Parent dashboard (no childId): Get ALL assignments created by parent
    // - Admin dashboard (no childId): Get ALL assignments from all parents
    // - Student view (childId provided or student user): Get only assigned assignments
    let assignmentsData, assignmentsError

    if (user.role === 'admin' && !childId) {
      // Admin dashboard - show all assignments from all parents
      const { data, error } = await supabase.rpc(
        'get_all_assignments_with_parents',
      )
      assignmentsData = data
      assignmentsError = error
    } else if (user.role === 'parent' && !childId) {
      // Parent dashboard - show all assignments they created
      const result = await supabase
        .from('assignments')
        .select('*')
        .eq('parent_id', parentId)
        .order('due_date', { ascending: true })
      assignmentsData = result.data
      assignmentsError = result.error
    } else {
      // Student view - only show assignments assigned to specific student
      // First, get student assignments using elevated privileges
      try {
        const { data: studentAssignmentData, error: studentAssignmentError } =
          await supabase.rpc('admin_get_student_assignments', {
            p_student_id: studentId,
          })

        if (studentAssignmentError) {
          assignmentsError = studentAssignmentError
          assignmentsData = []
        } else if (
          !studentAssignmentData ||
          studentAssignmentData.length === 0
        ) {
          // Student has no assignments
          assignmentsData = []
          assignmentsError = null
        } else {
          // Get the assignment IDs this student is assigned to
          const studentAssignmentIds = studentAssignmentData.map(
            (sa: { assignment_id: string }) => sa.assignment_id,
          )

          // Now fetch the actual assignments
          // For admins, don't filter by parent_id since they can see all assignments
          const result = await supabase
            .from('assignments')
            .select('*')
            .in('id', studentAssignmentIds)
            .order('due_date', { ascending: true })

          assignmentsData = result.data
          assignmentsError = result.error
        }
      } catch (rpcError: unknown) {
        assignmentsError = rpcError as Error
        assignmentsData = []
      }
    }

    if (assignmentsError) {
      return NextResponse.json({
        assignments: [],
        error: assignmentsError.message,
      })
    }

    // Get completion status

    let completions = []

    // Always fetch completions for the target student
    const { data: completionData } = await supabase
      .from('student_assignments')
      .select('assignment_id, completed, completed_at, instance_date')
      .eq('student_id', studentId)

    completions = completionData || []

    // Get all student assignments for these assignments to find assigned children
    const assignmentIds = assignmentsData?.map((a) => a.id) || []
    const { data: allStudentAssignments } = await supabase
      .from('student_assignments')
      .select(
        `
        assignment_id,
        student_id,
        profiles!inner(name, role)
      `,
      )
      .in('assignment_id', assignmentIds)

    // Create maps for completion and assigned children
    // For recurring assignments, we need to group completions by assignment_id
    const completionMap = new Map()
    const instanceCompletionMap = new Map()

    completions?.forEach(
      (c: {
        assignment_id: string
        instance_date?: string
        student_id: string
        [key: string]: unknown
      }) => {
        if (c.instance_date) {
          // Recurring assignment instance
          if (!instanceCompletionMap.has(c.assignment_id)) {
            instanceCompletionMap.set(c.assignment_id, new Map())
          }
          instanceCompletionMap.get(c.assignment_id).set(c.instance_date, c)
        } else {
          // Regular assignment
          completionMap.set(c.assignment_id, c)
        }
      },
    )

    const assignedChildrenMap = new Map()
    allStudentAssignments?.forEach(
      (sa: {
        assignment_id: string
        profiles: { name: string; role: string }
      }) => {
        // Skip if we find parents in student_assignments (this shouldn't happen)

        // Only include actual students (role = 'student'), not parents
        if (sa.profiles.role === 'student') {
          if (!assignedChildrenMap.has(sa.assignment_id)) {
            assignedChildrenMap.set(sa.assignment_id, [])
          }
          assignedChildrenMap.get(sa.assignment_id).push(sa.profiles.name)
        }
      },
    )

    const assignmentsWithCompletion =
      assignmentsData?.map((a: Assignment) => {
        const completion = completionMap.get(a.id)
        const instanceCompletions = instanceCompletionMap.get(a.id)

        const result = {
          ...a,
          links: Array.isArray(a.links) ? a.links : [],
          completed: completion?.completed || false,
          completed_at: completion?.completed_at,
          assigned_children: assignedChildrenMap.get(a.id) || [],
          // Add instance completions for recurring assignments
          instance_completions: instanceCompletions
            ? Object.fromEntries(instanceCompletions)
            : {},
        }

        return result
      }) || []

    return NextResponse.json(
      {
        assignments: assignmentsWithCompletion,
        profile: { role: user.role }, // Return minimal profile data for compatibility
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    )
  } catch {
    return NextResponse.json({
      assignments: [],
      error: 'Internal server error',
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      title,
      content,
      links,
      due_date,
      category,
      selectedChildren,
      is_recurring,
      recurrence_pattern,
      recurrence_end_date,
    } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Assignment title is required' },
        { status: 400 },
      )
    }

    if (!selectedChildren || selectedChildren.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one child for this assignment' },
        { status: 400 },
      )
    }

    let supabase
    try {
      supabase = await createClient()
    } catch {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 },
      )
    }

    // Use session-based authentication
    const { user, error: authError } = await validateAuth(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to create assignments' },
        { status: 401 },
      )
    }

    // Create the assignment - ensure dates are properly formatted
    const parsedDueDate = due_date
      ? new Date(due_date).toISOString().split('T')[0]
      : null
    const parsedRecurrenceEndDate =
      is_recurring && recurrence_end_date
        ? new Date(recurrence_end_date).toISOString().split('T')[0]
        : null

    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        parent_id: user.id,
        title: title.trim(),
        content: content,
        links: links || [],
        due_date: parsedDueDate,
        category: category || '',
        is_recurring: is_recurring || false,
        recurrence_pattern: is_recurring ? recurrence_pattern : null,
        recurrence_end_date: parsedRecurrenceEndDate,
        next_due_date: is_recurring ? parsedDueDate : null,
      })
      .select()
      .single()

    if (assignmentError) {
      return NextResponse.json(
        { error: `Failed to create assignment: ${assignmentError.message}` },
        { status: 500 },
      )
    }

    if (!assignmentData) {
      return NextResponse.json(
        { error: 'Assignment creation failed' },
        { status: 500 },
      )
    }

    // Create student assignments for selected children
    if (selectedChildren.length > 0) {
      const studentAssignments = selectedChildren.map((childId: string) => ({
        assignment_id: assignmentData.id,
        student_id: childId,
        completed: false,
      }))

      const { error: studentError } = await supabase
        .from('student_assignments')
        .insert(studentAssignments)

      if (studentError) {
        return NextResponse.json(
          { error: 'Assignment created but failed to assign to some students' },
          { status: 207 }, // Partial success
        )
      }
    }

    return NextResponse.json({
      success: true,
      assignment: assignmentData,
      message: `Assignment "${title.trim()}" created successfully`,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const assignmentId = url.searchParams.get('id')

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 },
      )
    }

    const {
      title,
      content,
      links,
      due_date,
      category,
      selectedChildren,
      is_recurring,
      recurrence_pattern,
      recurrence_end_date,
    } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Assignment title is required' },
        { status: 400 },
      )
    }

    let supabase
    try {
      supabase = await createClient()
    } catch {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 },
      )
    }

    // Use session-based authentication
    const { user, error: authError } = await validateAuth(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to update assignments' },
        { status: 401 },
      )
    }

    // Get user profile to check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()


    // First, check if the assignment exists
    const { data: existingAssignment, error: checkError } = await supabase
      .from('assignments')
      .select('id, title, parent_id')
      .eq('id', assignmentId)
      .single()

    if (checkError || !existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 },
      )
    }

    // Check permissions
    if (user.role !== 'admin' && existingAssignment.parent_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this assignment' },
        { status: 403 },
      )
    }

    // Update the assignment - ensure dates are properly formatted
    const parsedDueDate = due_date
      ? new Date(due_date).toISOString().split('T')[0]
      : null
    const parsedRecurrenceEndDate =
      is_recurring && recurrence_end_date
        ? new Date(recurrence_end_date).toISOString().split('T')[0]
        : null

    const updateData = {
      title: title.trim(),
      content: content,
      links: links || [],
      due_date: parsedDueDate,
      category: category || '',
      is_recurring: is_recurring || false,
      recurrence_pattern: is_recurring ? recurrence_pattern : null,
      recurrence_end_date: parsedRecurrenceEndDate,
      next_due_date: is_recurring ? parsedDueDate : null,
    }


    let updateQuery = supabase
      .from('assignments')
      .update(updateData)
      .eq('id', assignmentId)

    // Only filter by parent_id for non-admin users
    if (user.role !== 'admin') {
      updateQuery = updateQuery.eq('parent_id', user.id)
    }

    const { data: assignmentData, error: assignmentError } = await updateQuery
      .select()

    if (assignmentError) {
      return NextResponse.json(
        { error: `Failed to update assignment: ${assignmentError.message}` },
        { status: 500 },
      )
    }

    if (!assignmentData || assignmentData.length === 0) {
      return NextResponse.json(
        {
          error:
            'Assignment not found or you do not have permission to update it',
        },
        { status: 404 },
      )
    }

    // Get the first (and should be only) updated assignment
    const updatedAssignment = assignmentData[0]

    // Update student assignments if selectedChildren is provided
    if (selectedChildren && Array.isArray(selectedChildren)) {
      // First, remove all existing student assignments for this assignment
      await supabase
        .from('student_assignments')
        .delete()
        .eq('assignment_id', assignmentId)

      // Then, add the new student assignments
      if (selectedChildren.length > 0) {
        const studentAssignments = selectedChildren.map((childId: string) => ({
          assignment_id: assignmentId,
          student_id: childId,
          completed: false,
        }))

        const { error: studentError } = await supabase
          .from('student_assignments')
          .insert(studentAssignments)

        if (studentError) {
          return NextResponse.json(
            {
              error:
                'Assignment updated but failed to update student assignments',
            },
            { status: 207 }, // Partial success
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
      message: `Assignment "${title.trim()}" updated successfully`,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const assignmentId = url.searchParams.get('id')

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 },
      )
    }

    let supabase
    try {
      supabase = await createClient()
    } catch {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 },
      )
    }

    // Use session-based authentication
    const { user, error: authError } = await validateAuth(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete assignments' },
        { status: 401 },
      )
    }

    // Delete the assignment (this will cascade to student_assignments due to foreign key)
    let deleteQuery = supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId)

    // Only filter by parent_id for non-admin users
    if (user.role !== 'admin') {
      deleteQuery = deleteQuery.eq('parent_id', user.id)
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete assignment: ${deleteError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
