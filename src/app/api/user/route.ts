import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // No-op for GET requests
        },
      },
    }
  )

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return NextResponse.json({ user: null, error: error.message })
    }
    
    return NextResponse.json({ user, error: null })
  } catch (error) {
    return NextResponse.json({ user: null, error: 'Failed to get user' })
  }
}