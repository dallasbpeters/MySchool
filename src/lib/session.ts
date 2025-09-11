import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

const key = new TextEncoder().encode(process.env.SESSION_SECRET || 'fallback-secret-key-32-chars-long!')

export interface SessionPayload {
  userId: string
  email: string
  role: string
  parentId?: string
  firstName?: string
  lastName?: string
  expiresAt: number
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('4h')
    .sign(key)
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })
    
    // Check if token has expired
    const now = Math.floor(Date.now() / 1000)
    if (payload.expiresAt && typeof payload.expiresAt === 'number' && payload.expiresAt < now) {
      return null
    }
    
    return payload as SessionPayload
  } catch (error) {
    console.error('Session decryption failed:', error)
    return null
  }
}

export async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get('session')?.value
  return await decrypt(token)
}

export function createSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production'
  const sameSite = 'lax'
  const maxAge = 4 * 60 * 60 // 4 hours
  
  return `session=${token}; HttpOnly; Secure=${secure}; SameSite=${sameSite}; Max-Age=${maxAge}; Path=/`
}

export function clearSessionCookie(): string {
  return 'session=; HttpOnly; Secure; SameSite=lax; Max-Age=0; Path=/'
}