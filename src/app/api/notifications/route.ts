import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
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

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ notifications: [], count: 0 })
    }

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('parent_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ notifications: [], count: 0 })
    }

    const notifications: any[] = []
    const now = new Date()

    if (profile.role === 'student') {
      // For students: check overdue assignments
      const parentId = profile.parent_id
      if (parentId) {
        const { data: assignments } = await supabase
          .from('assignments')
          .select(`
            id, title, due_date,
            student_assignments!inner(completed, student_id)
          `)
          .eq('parent_id', parentId)
          .eq('student_assignments.student_id', user.id)
          .lt('due_date', now.toISOString())

        if (assignments) {
          assignments.forEach(assignment => {
            // Since we're using inner join, we know this student is assigned
            // Check if they've completed it
            const completion = assignment.student_assignments?.[0] // Should only be one since we filtered by student_id

            if (!completion?.completed) {
              notifications.push({
                id: `overdue-${assignment.id}`,
                type: 'overdue',
                title: 'Overdue Assignment',
                message: `${assignment.title} is overdue`,
                href: '/student',
                created_at: assignment.due_date
              })
            }
          })
        }
      }

      // Check assignments due today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      if (parentId) {
        const { data: todayAssignments } = await supabase
          .from('assignments')
          .select(`
            id, title, due_date,
            student_assignments!inner(completed, student_id)
          `)
          .eq('parent_id', parentId)
          .eq('student_assignments.student_id', user.id)
          .gte('due_date', today.toISOString())
          .lt('due_date', tomorrow.toISOString())

        if (todayAssignments) {
          todayAssignments.forEach(assignment => {
            // Since we're using inner join, we know this student is assigned
            const completion = assignment.student_assignments?.[0] // Should only be one since we filtered by student_id

            if (!completion?.completed) {
              notifications.push({
                id: `due-today-${assignment.id}`,
                type: 'due-today',
                title: 'Assignment Due Today',
                message: `${assignment.title} is due today`,
                href: '/student',
                created_at: assignment.due_date
              })
            }
          })
        }
      }
    } else if (profile.role === 'parent') {
      // For parents: check children's overdue assignments
      const { data: children } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('parent_id', user.id)
        .eq('role', 'student')

      if (children && children.length > 0) {
        for (const child of children) {
          const { data: assignments } = await supabase
            .from('assignments')
            .select(`
              id, title, due_date,
              student_assignments!left(completed, student_id)
            `)
            .eq('parent_id', user.id)
            .lt('due_date', now.toISOString())

          if (assignments) {
            assignments.forEach(assignment => {
              const completion = assignment.student_assignments?.find(
                (sa: any) => sa.student_id === child.id
              )

              if (!completion?.completed) {
                notifications.push({
                  id: `child-overdue-${child.id}-${assignment.id}`,
                  type: 'child-overdue',
                  title: 'Child has Overdue Assignment',
                  message: `${child.name} has an overdue assignment: ${assignment.title}`,
                  href: '/parent/children',
                  created_at: assignment.due_date
                })
              }
            })
          }
        }
      }
    }

    // Sort by most urgent first (overdue, then due today, then by date)
    notifications.sort((a, b) => {
      const typeOrder = { 'overdue': 0, 'child-overdue': 1, 'due-today': 2 }
      const aOrder = typeOrder[a.type as keyof typeof typeOrder] ?? 3
      const bOrder = typeOrder[b.type as keyof typeof typeOrder] ?? 3

      if (aOrder !== bOrder) return aOrder - bOrder
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Limit to most recent 10 notifications
    const limitedNotifications = notifications.slice(0, 10)

    return NextResponse.json({
      notifications: limitedNotifications,
      count: notifications.length
    })

  } catch (error: any) {
    console.error('Notifications API error:', error)
    return NextResponse.json({ notifications: [], count: 0 })
  }
}
