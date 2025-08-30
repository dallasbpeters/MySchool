import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (existingProfile) {
    return NextResponse.json({ success: true, message: 'Profile already exists' })
  }

  // Create the profile
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email || 'authenticated@example.com',
      role: 'parent',
      name: user.user_metadata?.full_name || 'Authenticated User'
    })
    .select()
    .single()

  if (error) {
    console.error('Profile creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, profile: data })
}