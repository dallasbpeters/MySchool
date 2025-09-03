import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {

      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    // Get the current user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {

      return NextResponse.json(
        { error: 'Invalid session. Please try the reset link again.' },
        { status: 401 }
      )
    }



    // Update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {

      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }



    return NextResponse.json({ success: true })

  } catch (error: any) {

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
