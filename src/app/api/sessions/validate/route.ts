import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value

    if (!sessionCookie) {
      return NextResponse.json(
        { valid: false, error: 'No session found' },
        { status: 401 }
      )
    }

    // Decrypt and validate session
    const session = await decrypt(sessionCookie)

    if (!session) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
        parent_id: session.parentId,
        first_name: session.firstName,
        last_name: session.lastName,
      }
    })
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}