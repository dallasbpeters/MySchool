import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const { name, studentId } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to update profiles' },
        { status: 401 }
      )
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, parent_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Determine which profile to update
    let targetId = user.id

    if (studentId && (profile.role === 'admin' || profile.role === 'parent')) {
      // Admin can update any student, parent can update their children
      if (profile.role === 'parent') {
        // Verify the student is their child
        const { data: student } = await supabase
          .from('profiles')
          .select('parent_id')
          .eq('id', studentId)
          .single()

        if (!student || student.parent_id !== user.id) {
          return NextResponse.json(
            { error: 'You can only update your own children' },
            { status: 403 }
          )
        }
      }
      targetId = studentId
    }

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', targetId)
      .select('id, name')

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update profile: ${updateError.message}` },
        { status: 500 }
      )
    }

    if (!updatedProfile || updatedProfile.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found or no permission to update' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile[0],
      message: 'Name updated successfully'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
