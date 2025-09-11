import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Clear session cookie by setting it to expire immediately
    const response = NextResponse.json({ success: true })
    
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Session destruction error:', error)
    return NextResponse.json(
      { error: 'Failed to destroy session' },
      { status: 500 }
    )
  }
}