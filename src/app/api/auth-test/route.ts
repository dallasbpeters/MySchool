import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/auth/session-middleware'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await validateAuth(request)
    
    return NextResponse.json({
      success: !error,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        hasSession: !!request.cookies.get('session')?.value
      } : null,
      error: error || null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Authentication check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}