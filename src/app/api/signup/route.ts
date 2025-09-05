import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, signupCode } = await request.json()

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      )
    }

    // Use name if provided, otherwise derive from email
    const userName = name || email.split('@')[0]

    let supabase
    try {
      supabase = await createClient()
    } catch {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    // If student, validate signup code first
    let parentId: string | null = null
    let childName = userName

    if (role === 'student') {
      if (!signupCode?.trim()) {
        return NextResponse.json(
          { error: 'Signup code is required for students' },
          { status: 400 }
        )
      }

      // Validate signup code
      const { data: codes, error: codeError } = await supabase
        .from('signup_codes')
        .select('parent_id, child_name, used, code')
        .eq('code', signupCode.trim().toUpperCase())
        .single()

      if (codeError || !codes) {
        return NextResponse.json(
          { error: 'Invalid signup code' },
          { status: 400 }
        )
      }

      if (codes.used) {
        return NextResponse.json(
          { error: 'This signup code has already been used' },
          { status: 400 }
        )
      }

      parentId = codes.parent_id
      childName = codes.child_name // Use name from signup code
    }

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: childName,
          role: role
        }
      }
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      )
    }

    // Create profile in database
    try {
      const profileData: { id: string; email: string; name: string; role: string; parent_id?: string } = {
        id: data.user.id,
        email: email,
        name: childName,
        role: role
      }

      if (role === 'student' && parentId) {
        profileData.parent_id = parentId
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single()

      if (profileError) {
        return NextResponse.json(
          { error: `Profile creation failed: ${profileError.message}` },
          { status: 500 }
        )
      }

      // If student, mark signup code as used
      if (role === 'student' && signupCode) {
        const { error: updateError } = await supabase
          .from('signup_codes')
          .update({
            used: true,
            used_by: data.user.id
          })
          .eq('code', signupCode.trim().toUpperCase())

        if (updateError) {
          // Handle error silently
        }
      }
    } catch {
      // Handle error silently
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session
    })

  } catch (error: unknown) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
