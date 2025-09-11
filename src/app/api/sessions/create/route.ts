import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { encrypt, type SessionPayload } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user from Supabase auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Get user profile information once
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('parent_id, role, firstName, lastName')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Create session payload
    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email || '',
      role: profile.role,
      parentId: profile.parent_id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      expiresAt: Math.floor((Date.now() + 4 * 60 * 60 * 1000) / 1000), // 4 hours in seconds
    }

    // Encrypt session
    const encryptedSession = await encrypt(sessionPayload)

    // Set encrypted session cookie
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: profile.role,
        parent_id: profile.parent_id,
        first_name: profile.firstName,
        last_name: profile.lastName,
      }
    })

    response.cookies.set('session', encryptedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 4 * 60 * 60, // 4 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}