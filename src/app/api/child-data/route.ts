import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/auth/session-middleware'

export async function GET(request: NextRequest) {
  try {
    // Use session-based authentication
    const { user, error: authError } = await validateAuth(request)

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          assignments: [],
          recommendations: [],
          notes: [],
        },
        { status: 401 },
      )
    }

    // Get child ID from query params
    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
        { status: 400 },
      )
    }

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError)
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 },
      )
    }

    // Verify user has access to this child
    let hasAccess = false
    if (user.role === 'admin') {
      hasAccess = true
    } else if (user.role === 'parent') {
      const { data: child } = await supabase
        .from('profiles')
        .select('parent_id')
        .eq('id', childId)
        .single()

      hasAccess = child?.parent_id === user.id
    } else if (user.role === 'student') {
      hasAccess = user.id === childId
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const response = {
      assignments: [],
      recommendations: [],
      notes: [],
    }

    try {
      // Fetch all data in parallel for efficiency
      const [assignmentsResult, notesResult, recommendationsResult] =
        await Promise.allSettled([
          // Get assignments for child via student_assignments table
          (async () => {
            try {
              const {
                data: studentAssignmentData,
                error: studentAssignmentError,
              } = await supabase.rpc('admin_get_student_assignments', {
                p_student_id: childId,
              })

              if (studentAssignmentError || !studentAssignmentData?.length) {
                return { data: [], error: studentAssignmentError }
              }

              const studentAssignmentIds = studentAssignmentData.map(
                (sa: { assignment_id: string }) => sa.assignment_id,
              )

              const assignmentsResult = await supabase
                .from('assignments')
                .select('*')
                .in('id', studentAssignmentIds)
                .order('due_date', { ascending: true })

              if (assignmentsResult.error) {
                return { data: [], error: assignmentsResult.error }
              }

              // Merge completion status from student_assignments
              const assignmentsWithCompletion = assignmentsResult.data.map(assignment => {
                const completion = studentAssignmentData.find(
                  (sa: { assignment_id: string }) => sa.assignment_id === assignment.id
                )
                return {
                  ...assignment,
                  completed: completion?.completed || false,
                  completed_at: completion?.completed_at,
                  instance_date: completion?.instance_date
                }
              })

              return { data: assignmentsWithCompletion, error: null }
            } catch (error) {
              return { data: [], error }
            }
          })(),

          supabase
            .from('notes')
            .select('*')
            .eq('student_id', childId)
            .order('created_at', { ascending: false }),

          // Show all recommendations globally (no filtering by creator)
          supabase
            .from('recommendations')
            .select('*')
            .order('created_at', { ascending: false }),
        ])

      if (
        assignmentsResult.status === 'fulfilled' &&
        !assignmentsResult.value.error
      ) {
        response.assignments = assignmentsResult.value.data || []
      } else if (assignmentsResult.status === 'rejected') {
        console.error('Error fetching assignments:', assignmentsResult.reason)
      }

      if (notesResult.status === 'fulfilled' && !notesResult.value.error) {
        response.notes = notesResult.value.data || []
      } else if (notesResult.status === 'rejected') {
        console.error('Error fetching notes:', notesResult.reason)
      }

      if (
        recommendationsResult.status === 'fulfilled' &&
        !recommendationsResult.value.error
      ) {
        response.recommendations = recommendationsResult.value.data || []
      } else if (recommendationsResult.status === 'rejected') {
        console.error(
          'Error fetching recommendations:',
          recommendationsResult.reason,
        )
      }
    } catch (dataError) {
      console.error('Error fetching child data:', dataError)
      // Return partial data rather than failing completely
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Child data API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        assignments: [],
        recommendations: [],
        notes: [],
      },
      { status: 500 },
    )
  }
}
