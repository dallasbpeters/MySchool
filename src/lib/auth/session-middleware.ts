import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

export interface SessionUser {
  id: string
  email: string
  role: string
  parent_id?: string
  first_name?: string
  last_name?: string
}

export interface SessionValidationResult {
  user: SessionUser | null
  error?: string
}

export async function validateSession(request: NextRequest): Promise<SessionValidationResult> {
  try {
    // First check if session data is in headers (from middleware)
    const userIdHeader = request.headers.get('X-User-Id')
    const userRoleHeader = request.headers.get('X-User-Role')
    const userParentIdHeader = request.headers.get('X-User-Parent-Id')
    
    if (userIdHeader && userRoleHeader) {
      return {
        user: {
          id: userIdHeader,
          email: '', // Not available in headers, but not needed for most API calls
          role: userRoleHeader,
          parent_id: userParentIdHeader || undefined,
          first_name: undefined,
          last_name: undefined,
        }
      }
    }

    // Fall back to decrypting session cookie directly
    const sessionCookie = request.cookies.get('session')?.value
    
    if (!sessionCookie) {
      return { user: null, error: 'No session found' }
    }

    const session = await decrypt(sessionCookie)
    
    if (!session) {
      return { user: null, error: 'Invalid or expired session' }
    }

    return {
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
        parent_id: session.parentId,
        first_name: session.firstName,
        last_name: session.lastName,
      }
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return { user: null, error: 'Internal server error' }
  }
}

// Middleware helper that falls back to Supabase auth if no session
export async function validateAuth(request: NextRequest): Promise<SessionValidationResult> {
  // First try session-based auth
  const sessionResult = await validateSession(request)
  
  if (sessionResult.user) {
    return sessionResult
  }

  // Fall back to Supabase auth for backward compatibility
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { user: null, error: 'Authentication failed' }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('parent_id, role, name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { user: null, error: 'Profile not found' }
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
        role: profile.role,
        parent_id: profile.parent_id,
        first_name: profile.name?.split(' ')[0],
        last_name: profile.name?.split(' ').slice(1).join(' '),
      }
    }
  } catch (error) {
    console.error('Auth validation error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}