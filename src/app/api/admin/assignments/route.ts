import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
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

    // Get user profile to verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()



    if (!profile || profile.role !== 'admin') {

      return NextResponse.json({
        assignments: [],
        error: 'Admin access required'
      }, { status: 403 })
    }

    // Get ALL assignments across all families - admin bypass


    // Use the RPC function which bypasses RLS
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .rpc('get_all_assignments_with_parents')





    if (assignmentsError) {
      return NextResponse.json({ assignments: [], error: assignmentsError.message })
    }

    // Get all student assignments to find assigned children
    const assignmentIds = assignmentsData?.map(a => a.id) || []


    const { data: allStudentAssignments, error: studentAssignmentsError } = await supabase
      .from('student_assignments')
      .select(`
        assignment_id,
        student_id,
        profiles(name, role, parent_id)
      `)
      .in('assignment_id', assignmentIds)
      .not('profiles', 'is', null)
      .eq('profiles.role', 'student')



    // Create maps for assigned children (names and full details)
    const assignedChildrenMap = new Map()
    const assignedChildrenDetailsMap = new Map()

    allStudentAssignments?.forEach((sa: any) => {
      if (sa.profiles.role === 'student') {
        // Map for names (backward compatibility)
        if (!assignedChildrenMap.has(sa.assignment_id)) {
          assignedChildrenMap.set(sa.assignment_id, [])
        }
        assignedChildrenMap.get(sa.assignment_id).push(sa.profiles.name)

        // Map for full details (includes IDs for editing)
        if (!assignedChildrenDetailsMap.has(sa.assignment_id)) {
          assignedChildrenDetailsMap.set(sa.assignment_id, [])
        }
        assignedChildrenDetailsMap.get(sa.assignment_id).push({
          id: sa.student_id,
          name: sa.profiles.name,
          parent_id: sa.profiles.parent_id
        })
      }
    })

    const assignmentsWithDetails = assignmentsData?.map((a: any) => ({
      ...a,
      links: Array.isArray(a.links) ? a.links : [],
      assigned_children: assignedChildrenMap.get(a.id) || [],
      assigned_children_details: assignedChildrenDetailsMap.get(a.id) || [], // Include full details for editing
      parent_name: a.parent_name || 'Unknown Parent' // Comes directly from RPC function
    })) || []



    return NextResponse.json({
      assignments: assignmentsWithDetails
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
        { error: 'Please select at least one student for this assignment' },
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

    // Get the current user and verify admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to create assignments' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Create the assignment
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        parent_id: user.id, // Admin creates assignments
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



    if (assignmentError) {
      return NextResponse.json(
        { error: `Failed to create assignment: ${assignmentError.message}` },
        { status: 500 }
      )
    }

    if (!assignmentData || assignmentData.length === 0) {
      return NextResponse.json(
        { error: 'Assignment creation failed' },
        { status: 500 }
      )
    }

    const createdAssignment = assignmentData[0] // Get first (and should be only) result

    // Create student assignments for selected children
    if (selectedChildren.length > 0) {
      const studentAssignments = selectedChildren.map((childId: string) => ({
        assignment_id: createdAssignment.id,
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
      assignment: createdAssignment,
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

    // Get the current user and verify admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to update assignments' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Update the assignment using admin RPC function to bypass RLS
    const rpcParams = {
      assignment_id: assignmentId,
      assignment_title: title.trim(),
      assignment_content: content,
      assignment_links: links || [],
      assignment_due_date: due_date,
      assignment_category: category || '',
      assignment_is_recurring: is_recurring || false,
      assignment_recurrence_pattern: is_recurring ? recurrence_pattern : null,
      assignment_recurrence_end_date: is_recurring && recurrence_end_date ? recurrence_end_date : null,
      assignment_next_due_date: is_recurring ? due_date : null
    }

    // DEBUG: Log parameters being sent to RPC - this won't be stripped
    const debugInfo = `[ADMIN API DEBUG] Updating assignment ${assignmentId} with params: ${JSON.stringify(rpcParams, null, 2)}`
    process.stdout.write(debugInfo + '\n')
    
    // DEBUG: Log the request body that was received
    const requestBodyDebug = `[ADMIN API DEBUG] Original request body: ${JSON.stringify({ title, content, links, due_date, category }, null, 2)}`
    process.stdout.write(requestBodyDebug + '\n')

    const { data: assignmentData, error: assignmentError } = await supabase
      .rpc('admin_update_assignment', rpcParams)

    // DEBUG: Log RPC result
    const debugResult = `[ADMIN API DEBUG] RPC result - Data: ${JSON.stringify(assignmentData, null, 2)}, Error: ${JSON.stringify(assignmentError, null, 2)}`
    process.stdout.write(debugResult + '\n')

    // DEBUG: Verify database state after RPC call
    if (!assignmentError && assignmentData) {
      const { data: dbVerify, error: dbVerifyError } = await supabase
        .from('assignments')
        .select('id, title, links, updated_at')
        .eq('id', assignmentId)
        .single()
      
      const dbDebug = `[ADMIN API DEBUG] Post-RPC DB state - Data: ${JSON.stringify(dbVerify, null, 2)}, Error: ${JSON.stringify(dbVerifyError, null, 2)}`
      process.stdout.write(dbDebug + '\n')
    }

    if (assignmentError) {
      return NextResponse.json(
        { error: `Failed to update assignment: ${assignmentError.message}` },
        { status: 500 }
      )
    }

    if (!assignmentData || assignmentData.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found or no permission to update' },
        { status: 404 }
      )
    }

    const updatedAssignment = assignmentData[0] // Get first (and should be only) result

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
      assignment: updatedAssignment,
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

    // Get the current user and verify admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete assignments' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Delete the assignment using admin RPC function to bypass RLS
    const { data: deleteResult, error: deleteError } = await supabase
      .rpc('admin_delete_assignment', {
        assignment_id: assignmentId
      })



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
