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
        error: 'Only parents and admins can access children data'
      })
    }

    // Get children profiles
    const { data: children, error: childrenError } = await supabase
      .from('profiles')
      .select('id, name, email, created_at, role, parent_id')
      .eq('parent_id', user.id)
      .eq('role', 'student')
      .order('created_at', { ascending: true })

    // Debug logging


    if (childrenError) {
      return NextResponse.json({ children: [], error: childrenError.message })
    }

    return NextResponse.json({
      children: children || []
    })

  } catch (error: any) {
    return NextResponse.json({ children: [], error: 'Internal server error' })
  }
}
