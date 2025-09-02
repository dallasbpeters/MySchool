import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const childId = url.searchParams.get('childId')

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
      return NextResponse.json({ assignments: [], error: 'No user found' })
    }

    // Get user profile to determine parent_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('parent_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ assignments: [], profile: null })
    }

        // Determine which parent's assignments to fetch and which student to view as
    let parentId = profile.role === 'parent' ? user.id : profile.parent_id
    let studentId = childId || user.id

    // If parent is requesting child view, verify the child belongs to them
    if (childId && profile.role === 'parent') {
      const { data: childProfile } = await supabase
        .from('profiles')
        .select('parent_id')
        .eq('id', childId)
        .single()

      if (!childProfile || childProfile.parent_id !== user.id) {
        return NextResponse.json({ assignments: [], error: 'Child not found or not authorized' })
      }
    }

    // Get assignments
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .eq('parent_id', parentId)
      .order('due_date', { ascending: true })

    if (assignmentsError) {
      return NextResponse.json({ assignments: [], error: assignmentsError.message })
    }

    // Get completion status 
    console.log('API: Getting completions for role:', profile.role, 'studentId:', studentId, 'childId:', childId)
    let completions = []

    // Always fetch completions for the target student
    const { data: completionData } = await supabase
      .from('student_assignments')
      .select('assignment_id, completed, completed_at, instance_date')
      .eq('student_id', studentId)
    console.log('API: Found completions:', completionData?.length || 0)
    completions = completionData || []

    // Get all student assignments for these assignments to find assigned children
    const assignmentIds = assignmentsData?.map(a => a.id) || []
    const { data: allStudentAssignments } = await supabase
      .from('student_assignments')
      .select(`
        assignment_id,
        student_id,
        profiles!inner(name, role)
      `)
      .in('assignment_id', assignmentIds)

    // Create maps for completion and assigned children
    // For recurring assignments, we need to group completions by assignment_id
    const completionMap = new Map()
    const instanceCompletionMap = new Map()

    completions?.forEach((c: any) => {
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
    })

    const assignedChildrenMap = new Map()
    allStudentAssignments?.forEach((sa: any) => {
      // Debug: log if we find parents in student_assignments (this shouldn't happen)
      if (sa.profiles.role === 'parent') {
        console.log('WARNING: Found parent in student_assignments:', sa)
      }

      // Only include actual students (role = 'student'), not parents
      if (sa.profiles.role === 'student') {
        if (!assignedChildrenMap.has(sa.assignment_id)) {
          assignedChildrenMap.set(sa.assignment_id, [])
        }
        assignedChildrenMap.get(sa.assignment_id).push(sa.profiles.name)
      }
    })

    const assignmentsWithCompletion = assignmentsData?.map((a: any) => {
      const completion = completionMap.get(a.id) as any
      const instanceCompletions = instanceCompletionMap.get(a.id)

      return {
        ...a,
        links: Array.isArray(a.links) ? a.links : [],
        completed: completion?.completed || false,
        completed_at: completion?.completed_at,
        assigned_children: assignedChildrenMap.get(a.id) || [],
        // Add instance completions for recurring assignments
        instance_completions: instanceCompletions ? Object.fromEntries(instanceCompletions) : {}
      }
    }) || []

    return NextResponse.json({
      assignments: assignmentsWithCompletion,
      profile: profile
    })

  } catch (error: any) {
    return NextResponse.json({ assignments: [], error: 'Internal server error' })
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
      recurrence_end_date
    } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Assignment title is required' },
        { status: 400 }
      )
    }

    if (!selectedChildren || selectedChildren.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one child for this assignment' },
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
        { error: 'You must be logged in to create assignments' },
        { status: 401 }
      )
    }

    // Create the assignment
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        parent_id: user.id,
        title: title.trim(),
        content: content,
        links: links || [],
        due_date: due_date,
        category: category || '',
        is_recurring: is_recurring || false,
        recurrence_pattern: is_recurring ? recurrence_pattern : null,
        recurrence_end_date: is_recurring && recurrence_end_date ? recurrence_end_date : null,
        next_due_date: is_recurring ? due_date : null
      })
      .select()
      .single()

    if (assignmentError) {
      return NextResponse.json(
        { error: `Failed to create assignment: ${assignmentError.message}` },
        { status: 500 }
      )
    }

    if (!assignmentData) {
      return NextResponse.json(
        { error: 'Assignment creation failed' },
        { status: 500 }
      )
    }

    // Create student assignments for selected children
    if (selectedChildren.length > 0) {
      const studentAssignments = selectedChildren.map((childId: string) => ({
        assignment_id: assignmentData.id,
        student_id: childId,
        completed: false
      }))

      const { error: studentError } = await supabase
        .from('student_assignments')
        .insert(studentAssignments)

      if (studentError) {
        return NextResponse.json(
          { error: 'Assignment created but failed to assign to some students' },
          { status: 207 } // Partial success
        )
      }
    }

    return NextResponse.json({
      success: true,
      assignment: assignmentData,
      message: `Assignment "${title.trim()}" created successfully`
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
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
        { status: 400 }
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
      recurrence_end_date
    } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Assignment title is required' },
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
        { error: 'You must be logged in to update assignments' },
        { status: 401 }
      )
    }

    // Update the assignment
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .update({
        title: title.trim(),
        content: content,
        links: links || [],
        due_date: due_date,
        category: category || '',
        is_recurring: is_recurring || false,
        recurrence_pattern: is_recurring ? recurrence_pattern : null,
        recurrence_end_date: is_recurring && recurrence_end_date ? recurrence_end_date : null,
        next_due_date: is_recurring ? due_date : null
      })
      .eq('id', assignmentId)
      .eq('parent_id', user.id) // Ensure user can only update their own assignments
      .select()
      .single()

    if (assignmentError) {
      return NextResponse.json(
        { error: `Failed to update assignment: ${assignmentError.message}` },
        { status: 500 }
      )
    }

    if (!assignmentData) {
      return NextResponse.json(
        { error: 'Assignment not found or you do not have permission to update it' },
        { status: 404 }
      )
    }

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
          completed: false
        }))

        const { error: studentError } = await supabase
          .from('student_assignments')
          .insert(studentAssignments)

        if (studentError) {
          return NextResponse.json(
            { error: 'Assignment updated but failed to update student assignments' },
            { status: 207 } // Partial success
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      assignment: assignmentData,
      message: `Assignment "${title.trim()}" updated successfully`
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
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
        { error: 'You must be logged in to delete assignments' },
        { status: 401 }
      )
    }

    // Delete the assignment (this will cascade to student_assignments due to foreign key)
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId)
      .eq('parent_id', user.id) // Ensure user can only delete their own assignments

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete assignment: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
