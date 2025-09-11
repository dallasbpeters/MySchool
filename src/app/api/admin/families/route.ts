import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/auth/session-middleware'

export async function GET(request: NextRequest) {
  try {
    // Use session-based authentication
    const { user, error: authError } = await validateAuth(request)
    
    if (authError || !user) {
      return NextResponse.json({ families: [], error: 'Authentication failed' })
    }

    // Verify admin role
    if (user.role !== 'admin') {
      return NextResponse.json(
        {
          families: [],
          error: 'Admin access required',
        },
        { status: 403 },
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

    // Get all parents (including admins who have children)
    const { data: parents, error: parentsError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .in('role', ['parent', 'admin'])
      .order('name', { ascending: true })

    if (parentsError) {
      return NextResponse.json({ families: [], error: parentsError.message })
    }

    // Get all children for each parent
    const families = []

    for (const parent of parents || []) {
      const { data: children } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('parent_id', parent.id)
        .eq('role', 'student')
        .order('name', { ascending: true })

      // Only include families that have children
      if (children && children.length > 0) {
        families.push({
          parent_id: parent.id,
          parent_name: parent.name,
          parent_email: parent.email,
          children: children,
        })
      }
    }

    return NextResponse.json({
      families,
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/admin/families:', error)
    return NextResponse.json({ families: [], error: 'Internal server error' })
  }
}
