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
      return NextResponse.json({ events: [], users: [], error: 'No user found' })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, parent_id, name')
      .eq('id', user.id)
      .single()



    if (!profile) {
      return NextResponse.json({ events: [], users: [], error: 'Profile not found' })
    }

    // Get events and assignments based on user role
    let eventsQuery = supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        start_date,
        end_date,
        color,
        user_id,
        created_by,
        created_at,
        profiles!events_user_id_fkey(id, name)
      `)
      .order('start_date', { ascending: true })

    const { data: eventsData, error: eventsError } = await eventsQuery

    // Get assignments to display as calendar events
    let assignmentsData = []

    if (profile.role === 'admin') {
      // Admin: get all assignments with student details
      const { data: allAssignments } = await supabase.rpc('get_all_assignments_with_parents')

      // Get student assignments with names for all assignments
      if (allAssignments && allAssignments.length > 0) {
        const assignmentIds = allAssignments.map(a => a.id)
        const { data: studentAssignments } = await supabase
          .from('student_assignments')
          .select(`
            assignment_id,
            student_id,
            profiles!inner(name, role)
          `)
          .in('assignment_id', assignmentIds)
          .eq('profiles.role', 'student')

        // Map student names to assignments
        const studentMap = new Map()
        studentAssignments?.forEach((sa: any) => {
          if (!studentMap.has(sa.assignment_id)) {
            studentMap.set(sa.assignment_id, [])
          }
          studentMap.get(sa.assignment_id).push(sa.profiles.name)
        })

        // Add student names to assignments
        assignmentsData = allAssignments.map((assignment: any) => ({
          ...assignment,
          assigned_students: studentMap.get(assignment.id) || []
        }))
      } else {
        assignmentsData = []
      }
    } else if (profile.role === 'parent') {
      // Parent: get their children's assignments with student details
      const { data: childrenAssignments } = await supabase
        .from('assignments')
        .select(`
          *,
          student_assignments!inner(
            student_id,
            profiles!student_assignments_student_id_fkey(name, parent_id)
          )
        `)
        .eq('student_assignments.profiles.parent_id', user.id)

      // Group by assignment and collect student names
      const assignmentMap = new Map()
      childrenAssignments?.forEach((assignment: any) => {
        const assignmentId = assignment.id
        if (!assignmentMap.has(assignmentId)) {
          assignmentMap.set(assignmentId, {
            ...assignment,
            assigned_students: []
          })
        }
        const studentName = assignment.student_assignments?.profiles?.name
        if (studentName && !assignmentMap.get(assignmentId).assigned_students.includes(studentName)) {
          assignmentMap.get(assignmentId).assigned_students.push(studentName)
        }
      })

      assignmentsData = Array.from(assignmentMap.values())
    } else {
      // Student: get their assigned assignments with their own name
      const { data: studentAssignments } = await supabase
        .from('assignments')
        .select(`
          *,
          student_assignments!inner(student_id)
        `)
        .eq('student_assignments.student_id', user.id)

      assignmentsData = studentAssignments?.map((assignment: any) => ({
        ...assignment,
        assigned_students: [profile.name || 'Me']
      })) || []
    }

    if (eventsError) {
      return NextResponse.json({ events: [], users: [], error: eventsError.message })
    }

    // Format regular events for Big Calendar component
    const formattedEvents = eventsData?.map((event: any) => ({
      id: event.id, // Keep as string UUID
      title: event.title,
      description: event.description || '',
      startDate: event.start_date,
      endDate: event.end_date,
      color: event.color,
      user: {
        id: event.user_id,
        name: event.profiles?.name || 'Unknown User',
        picturePath: null // Optional for calendar interface
      }
    })) || []

    // Get completion data for assignments to determine colors
    let assignmentCompletionMap = new Map()
    if (assignmentsData && assignmentsData.length > 0) {
      const assignmentIds = assignmentsData.map(a => a.id)
      const { data: completionData } = await supabase
        .from('student_assignments')
        .select('assignment_id, completed, student_id')
        .in('assignment_id', assignmentIds)

      // Create a map of assignment completion status
      completionData?.forEach((completion: any) => {
        const key = completion.assignment_id
        if (!assignmentCompletionMap.has(key)) {
          assignmentCompletionMap.set(key, { completed: [], incomplete: [] })
        }
        if (completion.completed) {
          assignmentCompletionMap.get(key).completed.push(completion.student_id)
        } else {
          assignmentCompletionMap.get(key).incomplete.push(completion.student_id)
        }
      })
    }

    // Format assignments as calendar events
    const assignmentEvents = assignmentsData?.map((assignment: any) => {
      const completionData = assignmentCompletionMap.get(assignment.id)
      const now = new Date()
      now.setHours(0, 0, 0, 0) // Reset to start of today for date-only comparison

      // Parse due date as end of day for comparison
      const dueDate = new Date(assignment.due_date + 'T23:59:59')

      // Determine color based on completion status and due date
      let color: "blue" | "green" | "red" | "yellow" | "purple" | "orange" | "gray"
      if (completionData && completionData.completed.length > 0 && completionData.incomplete.length === 0) {
        // All assigned students completed
        color = 'gray'
      } else if (dueDate < now) {
        // Overdue (due date is before today)
        color = 'red'
      } else {
        // Default (upcoming/due today or future)
        color = 'yellow'
      }

      return {
        id: `assignment-${assignment.id}`, // String ID with prefix to avoid conflicts
        title: assignment.title,
        description: assignment.content ? 'Assignment details available' : 'Assignment due',
        startDate: `${assignment.due_date}T09:00:00+00:00`, // Default to 9 AM UTC
        endDate: `${assignment.due_date}T10:00:00+00:00`, // 1 hour duration UTC
        color: color,
        user: {
          id: assignment.parent_id,
          name: assignment.profiles?.name || assignment.parent_name || 'Teacher',
          picturePath: null
        },
        // Add assignment-specific metadata
        isAssignment: true,
        assignedStudents: assignment.assigned_students || []
      }
    }) || []



    // Combine events and assignments
    const allEvents = [...formattedEvents, ...assignmentEvents]



    // Get users based on role
    let usersData = []
    if (profile.role === 'admin') {
      // Admin: get all students AND themselves
      const { data: allStudents } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'student')
        .order('name', { ascending: true })

      // Add admin user to the list
      const studentsWithAdmin = [
        { id: user.id, name: 'Me (Admin)', picturePath: null },
        ...(allStudents?.map(student => ({ ...student, picturePath: null })) || [])
      ]
      usersData = studentsWithAdmin
    } else if (profile.role === 'parent') {
      // Parent: get their children AND themselves
      const { data: children } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('parent_id', user.id)
        .eq('role', 'student')
        .order('name', { ascending: true })

      // Add parent to the list
      const childrenWithParent = [
        { id: user.id, name: profile.name || 'Me', picturePath: null },
        ...(children?.map(child => ({ ...child, picturePath: null })) || [])
      ]
      usersData = childrenWithParent
    } else {
      // Student: just themselves
      usersData = [{
        id: user.id,
        name: profile.name || 'Me',
        picturePath: null
      }]
    }



    return NextResponse.json({
      events: allEvents,
      users: usersData
    })

  } catch (error: any) {
    return NextResponse.json({ events: [], users: [], error: 'Internal server error' })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      color,
      userId
    } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Event title is required' },
        { status: 400 }
      )
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
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
        { error: 'You must be logged in to create events' },
        { status: 401 }
      )
    }

    // Create the event
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert({
        title: title.trim(),
        description: description || '',
        start_date: startDate,
        end_date: endDate,
        color: color || 'blue',
        user_id: userId || user.id,
        created_by: user.id
      })
      .select()
      .single()

    if (eventError) {
      return NextResponse.json(
        { error: `Failed to create event: ${eventError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      event: eventData,
      message: `Event "${title.trim()}" created successfully`
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
    const eventId = url.searchParams.get('id')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const {
      title,
      description,
      startDate,
      endDate,
      color,
      userId
    } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Event title is required' },
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
        { error: 'You must be logged in to update events' },
        { status: 401 }
      )
    }

    // Update the event
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .update({
        title: title.trim(),
        description: description || '',
        start_date: startDate,
        end_date: endDate,
        color: color || 'blue',
        user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()

    if (eventError) {
      return NextResponse.json(
        { error: `Failed to update event: ${eventError.message}` },
        { status: 500 }
      )
    }

    if (!eventData || eventData.length === 0) {
      return NextResponse.json(
        { error: 'Event not found or no permission to update' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      event: eventData[0],
      message: `Event "${title.trim()}" updated successfully`
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
    const eventId = url.searchParams.get('id')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
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
        { error: 'You must be logged in to delete events' },
        { status: 401 }
      )
    }

    // Delete the event
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete event: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
