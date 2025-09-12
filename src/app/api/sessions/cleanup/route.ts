import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Delete expired sessions
    const { error } = await supabase
      .from('sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('Session cleanup error:', error)
      return NextResponse.json(
        { error: 'Failed to cleanup sessions' },
        { status: 500 }
      )
    }

    // Also cleanup sessions that haven't been accessed in 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('sessions')
      .delete()
      .lt('last_accessed', twentyFourHoursAgo)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session cleanup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Allow GET as well for easier testing
export async function GET() {
  return POST()
}