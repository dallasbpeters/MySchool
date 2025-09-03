import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ students: [], error: 'No user found' })
    }

    // Get user profile to verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({
        students: [],
        error: 'Admin access required'
      }, { status: 403 })
    }

    // Get ALL students across all families with parent information
    // First get all students
    const { data: studentsData, error: studentsError } = await supabase
      .from('profiles')
      .select('id, name, email, created_at, parent_id')
      .eq('role', 'student')
      .order('name', { ascending: true })

    if (studentsError) {
      return NextResponse.json({ students: [], error: studentsError.message })
    }

    // Then get all parent names separately to avoid RLS issues
    const { data: parentsData } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'parent')

    // Create parent name lookup map
    const parentNameMap = new Map()
    parentsData?.forEach((parent: { id: string; name: string }) => {
      parentNameMap.set(parent.id, parent.name)
    })

    // Format students with parent information
    const studentsWithParents = studentsData?.map((student: { id: string; name: string; parent_id: string; email: string; created_at: string }) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      created_at: student.created_at,
      parent_name: parentNameMap.get(student.parent_id) || 'Unknown Parent'
    })) || []



    return NextResponse.json({
      students: studentsWithParents
    })

  } catch (error: unknown) {
    console.error('Error in GET /api/admin/students:', error)
    return NextResponse.json({ students: [], error: 'Internal server error' })
  }
}
