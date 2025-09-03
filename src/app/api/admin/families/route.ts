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
      return NextResponse.json({ families: [], error: 'No user found' })
    }

    // Get user profile to verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({
        families: [],
        error: 'Admin access required'
      }, { status: 403 })
    }

    // Get all parents
    const { data: parents, error: parentsError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'parent')
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

      families.push({
        parent_id: parent.id,
        parent_name: parent.name,
        parent_email: parent.email,
        children: children || []
      })
    }

    return NextResponse.json({
      families
    })

  } catch (error: unknown) {
    console.error('Error in GET /api/admin/families:', error)
    return NextResponse.json({ families: [], error: 'Internal server error' })
  }
}
