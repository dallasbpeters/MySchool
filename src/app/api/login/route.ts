import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

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



    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }



    // Create response with session cookies
    const response = NextResponse.json({
      success: true,
      user: data.user,
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      } : null
    })

    // Set session cookies manually if session exists
    if (data.session) {

      const maxAge = 60 * 60 * 24 * 7 // 7 days

      response.cookies.set('sb-access-token', data.session.access_token, {
        maxAge,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })

      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        maxAge,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
    }

    return response

  } catch (error: unknown) {
    console.error('Error in POST /api/login:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
