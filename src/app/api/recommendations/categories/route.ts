import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError)
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 },
      )
    }

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ categories: [], error: 'No user found' })
    }

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('recommendations')
      .select('category')
      .not('category', 'is', null)
      .neq('category', '')

    if (profile?.role !== 'admin') {
      // Parents only see their own categories
      query = query.eq('created_by', user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching recommendation categories:', error)
      return NextResponse.json({
        categories: [],
        error: 'Failed to fetch categories',
      })
    }

    // Extract unique categories
    const uniqueCategories = [
      ...new Set(
        data
          .map((item: { category: string }) => item.category)
          .filter((category: string) => category && category.trim()),
      ),
    ]

    return NextResponse.json({
      categories: uniqueCategories.sort(),
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
