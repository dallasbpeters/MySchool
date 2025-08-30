import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Get the current user first
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Test current profile access
    const { data: profileBefore, error: errorBefore } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      message: 'Profile test',
      profileBefore,
      errorBefore: errorBefore ? {
        message: errorBefore.message,
        code: errorBefore.code,
        details: errorBefore.details
      } : null,
      userId: user.id,
      userEmail: user.email
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: String(error) 
    }, { status: 500 })
  }
}