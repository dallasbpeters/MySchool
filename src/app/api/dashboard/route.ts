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
          user: null,
          assignments: [],
          children: [],
          recommendations: [],
          notes: [],
        },
        { status: 401 },
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

    const response = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      assignments: [],
      children: [],
      recommendations: [],
      recommendationCategories: [],
      notes: [],
      selectedChild: null,
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const selectedChildId = searchParams.get('childId')

    try {
      if (user.role === 'admin') {
        // Admin: Get all students and their data
        const { data: students, error: studentsError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('role', 'student')
          .order('name')

        if (studentsError) {
          console.error('Error fetching students:', studentsError)
        } else {
          response.children = (students || []).map((student) => ({
            id: student.id,
            name: student.name,
            email:
              student.email ||
              `${student.name.toLowerCase().replace(/\s+/g, '.')}@student.local`,
          }))
        }

        // Get data for first student or selected student
        const targetStudentId =
          selectedChildId ||
          (response.children.length > 0 ? response.children[0].id : null)

        if (targetStudentId) {
          response.selectedChild =
            response.children.find((child) => child.id === targetStudentId) ||
            response.children[0]

          // Fetch assignments, notes, and recommendations in parallel
          const [assignmentsResult, notesResult, recommendationsResult] =
            await Promise.allSettled([
              // Get assignments for student via student_assignments table
              (async () => {
                try {
                  const {
                    data: studentAssignmentData,
                    error: studentAssignmentError,
                  } = await supabase.rpc('admin_get_student_assignments', {
                    p_student_id: targetStudentId,
                  })

                  if (
                    studentAssignmentError ||
                    !studentAssignmentData?.length
                  ) {
                    return { data: [], error: studentAssignmentError }
                  }

                  const studentAssignmentIds = studentAssignmentData.map(
                    (sa: { assignment_id: string }) => sa.assignment_id,
                  )

                  const result = await supabase
                    .from('assignments')
                    .select('*')
                    .in('id', studentAssignmentIds)
                    .order('due_date', { ascending: true })

                  if (result.error) {
                    return { data: [], error: result.error }
                  }

                  // Merge completion status from student_assignments
                  const assignmentsWithCompletion = result.data.map(assignment => {
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
                .eq('student_id', targetStudentId)
                .order('created_at', { ascending: false }),

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
          }

          if (notesResult.status === 'fulfilled' && !notesResult.value.error) {
            response.notes = notesResult.value.data || []
          }

          if (
            recommendationsResult.status === 'fulfilled' &&
            !recommendationsResult.value.error
          ) {
            response.recommendations = recommendationsResult.value.data || []
          }
        }
      } else if (user.role === 'parent') {
        // Parent: Get their children and data
        const { data: children, error: childrenError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('parent_id', user.id)
          .order('name')

        if (childrenError) {
          console.error('Error fetching children:', childrenError)
        } else {
          response.children = (children || []).map((child) => ({
            id: child.id,
            name: child.name,
            email:
              child.email ||
              `${child.name.toLowerCase().replace(/\s+/g, '.')}@student.local`,
          }))
        }

        // Get data for first child or selected child
        const targetChildId =
          selectedChildId ||
          (response.children.length > 0 ? response.children[0].id : null)

        if (targetChildId) {
          response.selectedChild =
            response.children.find((child) => child.id === targetChildId) ||
            response.children[0]

          // Fetch assignments, notes, and recommendations in parallel
          const [assignmentsResult, notesResult, recommendationsResult] =
            await Promise.allSettled([
              // Get assignments for child via student_assignments table
              (async () => {
                try {
                  const {
                    data: studentAssignmentData,
                    error: studentAssignmentError,
                  } = await supabase.rpc('admin_get_student_assignments', {
                    p_student_id: targetChildId,
                  })

                  if (
                    studentAssignmentError ||
                    !studentAssignmentData?.length
                  ) {
                    return { data: [], error: studentAssignmentError }
                  }

                  const studentAssignmentIds = studentAssignmentData.map(
                    (sa: { assignment_id: string }) => sa.assignment_id,
                  )

                  const result = await supabase
                    .from('assignments')
                    .select('*')
                    .in('id', studentAssignmentIds)
                    .order('due_date', { ascending: true })

                  if (result.error) {
                    return { data: [], error: result.error }
                  }

                  // Merge completion status from student_assignments
                  const assignmentsWithCompletion = result.data.map(assignment => {
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
                .eq('student_id', targetChildId)
                .order('created_at', { ascending: false }),

              // For parent dashboard, show all recommendations (global)
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
          }

          if (notesResult.status === 'fulfilled' && !notesResult.value.error) {
            response.notes = notesResult.value.data || []
          }

          if (
            recommendationsResult.status === 'fulfilled' &&
            !recommendationsResult.value.error
          ) {
            response.recommendations = recommendationsResult.value.data || []
          }
        }
      } else {
        // Student: Get their own data
        const [assignmentsResult, notesResult, recommendationsResult] =
          await Promise.allSettled([
            // Get assignments for student via student_assignments table
            (async () => {
              try {
                const {
                  data: studentAssignmentData,
                  error: studentAssignmentError,
                } = await supabase.rpc('admin_get_student_assignments', {
                  p_student_id: user.id,
                })

                if (studentAssignmentError || !studentAssignmentData?.length) {
                  return { data: [], error: studentAssignmentError }
                }

                const studentAssignmentIds = studentAssignmentData.map(
                  (sa: { assignment_id: string }) => sa.assignment_id,
                )

                const result = await supabase
                  .from('assignments')
                  .select('*')
                  .in('id', studentAssignmentIds)
                  .order('due_date', { ascending: true })

                if (result.error) {
                  return { data: [], error: result.error }
                }

                // Merge completion status from student_assignments
                const assignmentsWithCompletion = result.data.map(assignment => {
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
              .eq('student_id', user.id)
              .order('created_at', { ascending: false }),

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
        }

        if (notesResult.status === 'fulfilled' && !notesResult.value.error) {
          response.notes = notesResult.value.data || []
        }

        if (
          recommendationsResult.status === 'fulfilled' &&
          !recommendationsResult.value.error
        ) {
          response.recommendations = recommendationsResult.value.data || []
        }
      }
      // Fetch recommendation categories
      const { data: recCategories } = await supabase
        .from('recommendations')
        .select('category')
        .not('category', 'is', null)

      if (recCategories) {
        const uniqueCategories = [
          ...new Set(
            recCategories
              .map((r: { category: string }) => r.category)
              .filter((c: string) => c && c.trim()),
          ),
        ]
        response.recommendationCategories = uniqueCategories
      }
    } catch (dataError) {
      console.error('Error fetching dashboard data:', dataError)
      // Return partial data rather than failing completely
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        user: null,
        assignments: [],
        children: [],
        recommendations: [],
        notes: [],
      },
      { status: 500 },
    )
  }
}
