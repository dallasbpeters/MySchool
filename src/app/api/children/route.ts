import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/auth/session-middleware'

export async function GET(request: NextRequest) {
  try {
    // Use session-based authentication
    const { user, error: authError } = await validateAuth(request)
    
    if (authError || !user) {
      return NextResponse.json({ children: [], error: 'Authentication failed' })
    }

    // Only parents and admins can access children data
    if (user.role !== 'parent' && user.role !== 'admin') {
      return NextResponse.json({
        children: [],
        error: 'Only parents and admins can access children data',
      })
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

    // Get children profiles
    let query = supabase
      .from('profiles')
      .select('id, name, email, created_at, role, parent_id')
      .eq('role', 'student')
      .order('created_at', { ascending: true })

    // For parents, only show their children. For admins, show all children.
    if (user.role === 'parent') {
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
