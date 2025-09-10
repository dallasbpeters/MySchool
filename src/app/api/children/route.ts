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
        { status: 503 },
      )
    }

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ children: [], error: 'No user found' })
    }

    // Get user profile to verify they are a parent
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Only parents and admins can access children data
    if (userProfile?.role !== 'parent' && userProfile?.role !== 'admin') {
      return NextResponse.json({
        children: [],
        error: 'Only parents and admins can access children data',
      })
    }

    // Get children profiles
    let query = supabase
      .from('profiles')
      .select('id, name, email, created_at, role, parent_id')
      .eq('role', 'student')
      .order('created_at', { ascending: true })

    // For parents, only show their children. For admins, show all children.
    if (userProfile?.role === 'parent') {
      query = query.eq('parent_id', user.id)
    }
    // For admins, no additional filter - show all students

    const { data: children, error: childrenError } = await query

    if (childrenError) {
      return NextResponse.json({ children: [], error: childrenError.message })
    }

    return NextResponse.json({
      children: children || [],
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/children:', error)
    return NextResponse.json({ children: [], error: 'Internal server error' })
  }
}
