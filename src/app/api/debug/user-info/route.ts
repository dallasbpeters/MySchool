import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: userError?.message }, { status: 401 })
    }

    const userInfo = {
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
        app_metadata: user.app_metadata,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      },
      authCheck: 'Passed - user authenticated'
    }

    // Try to get profile with detailed error info
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      userInfo.profile = {
        data: profile,
        error: profileError?.message,
        success: !profileError
      }
    } catch (error) {
      userInfo.profile = {
        error: (error as Error).message,
        success: false
      }
    }

    // Try to get children with detailed error info
    try {
      const { data: children, error: childrenError } = await supabase
        .from('profiles')
        .select('*')
        .eq('parent_id', user.id)
        .eq('role', 'student')

      userInfo.children = {
        data: children,
        error: childrenError?.message,
        success: !childrenError,
        count: children?.length || 0
      }
    } catch (error) {
      userInfo.children = {
        error: (error as Error).message,
        success: false
      }
    }

    // Check for accounts ending in 2
    try {
      const { data: accounts2, error: accounts2Error } = await supabase
        .from('profiles')
        .select('*')
        .like('email', '%2@%')
        .eq('role', 'student')

      userInfo.accounts2 = {
        data: accounts2,
        error: accounts2Error?.message,
        success: !accounts2Error,
        count: accounts2?.length || 0
      }
    } catch (error) {
      userInfo.accounts2 = {
        error: (error as Error).message,
        success: false
      }
    }

    return NextResponse.json(userInfo)

  } catch (error) {
    console.error('User info error:', error)
    return NextResponse.json(
      { error: 'User info failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
