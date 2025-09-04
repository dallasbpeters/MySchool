import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get all profiles to see what's in the database
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profiles })
  } catch (error: unknown) {
    console.error('Error in GET /api/check-profiles:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
