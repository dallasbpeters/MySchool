import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { role } = await request.json()
    
    if (!role || !['parent', 'student'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    let result
    
    if (!existingProfile) {
      // Create profile if it doesn't exist
      result = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          role: role,
          name: user.user_metadata?.name || user.email?.split('@')[0]
        })
        .select()
    } else {
      // Update existing profile
      result = await supabase
        .from('profiles')
        .update({ role: role })
        .eq('id', user.id)
        .select()
    }

    if (result.error) {
      console.error('Database error:', result.error)
      return NextResponse.json(
        { error: 'Failed to update role', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      profile: result.data?.[0] 
    })
  } catch (error) {
    console.error('Error in fix-role API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}