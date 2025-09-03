import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { eachDayOfInterval, format, subDays } from 'date-fns'

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
      return NextResponse.json({ chartData: [], error: 'No user found' })
    }

    // Get user profile to check if they're a parent
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'parent' && profile.role !== 'admin')) {
      return NextResponse.json({ chartData: [], error: 'Access denied' })
    }

    // Get all children for this parent
    const { data: children } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('parent_id', user.id)
      .eq('role', 'student')

    if (!children || children.length === 0) {
      return NextResponse.json({ chartData: [], children: [], error: 'No children found' })
    }

    // Get date range for the last 7 days
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999) // Ensure we include the full day
    const startDate = subDays(endDate, 6) // 7 days including today
    startDate.setHours(0, 0, 0, 0) // Start from beginning of day

    // Get all completed assignments for these children in the date range
    const { data: completedAssignments } = await supabase
      .from('student_assignments')
      .select(`
        completed_at,
        student_id,
        profiles!inner(name)
      `)
      .in('student_id', children.map((c: any) => c.id))
      .eq('completed', true)
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString())

    // Generate chart data for each day
    const chartData = eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
      const dayData: any = {
        date: format(date, 'yyyy-MM-dd')
      }

      // Count completed assignments for each child on this day
      children.forEach((child: any) => {
        const completedCount = completedAssignments?.filter((assignment: any) => {
          const completedDate = new Date(assignment.completed_at)
          const dayStart = new Date(date)
          dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(date)
          dayEnd.setHours(23, 59, 59, 999)

          return assignment.student_id === child.id &&
            completedDate >= dayStart &&
            completedDate <= dayEnd
        })?.length || 0

        // Use child name as key for chart data
        dayData[child.name] = completedCount
      })

      return dayData
    })

    // Create chart config
    const chartConfig: any = {
      assignments: {
        label: "Completed Assignments",
      }
    }

    // Add each child to config with a unique color
    const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
    children.forEach((child: any, index: number) => {
      chartConfig[child.name] = {
        label: child.name,
        color: colors[index % colors.length]
      }
    })

    return NextResponse.json({
      chartData,
      children: children.map((c: any) => c.name),
      chartConfig
    })

  } catch (error: any) {

    return NextResponse.json({
      chartData: [],
      children: [],
      chartConfig: {},
      error: 'Internal server error'
    })
  }
}
