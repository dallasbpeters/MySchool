import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/auth/session-middleware'

export async function GET(request: NextRequest) {
  try {
    // Use session-based authentication
    const { user, error: authError } = await validateAuth(request)

    if (authError || !user) {
      return NextResponse.json({ recommendations: [], error: 'Authentication failed' })
    }

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

    let recommendations = []

    // Fetch all recommendations globally for all users
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recommendations:', error)
      return NextResponse.json({
        recommendations: [],
        error: 'Failed to fetch recommendations',
      })
    }

    recommendations = data || []

    return NextResponse.json(
      {
        recommendations,
        profile: {
          role: user.role,
          parent_id: user.parent_id,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use session-based authentication
    const { user, error: authError } = await validateAuth(request)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

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

    const body = await request.json()
    const { title, content, category, links } = body

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Insert recommendation
    const { data, error } = await supabase
      .from('recommendations')
      .insert({
        title: title.trim(),
        content,
        category: category?.trim() || null,
        links: links || [],
        created_by: user.id,
        parent_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating recommendation:', error)
      return NextResponse.json(
        { error: 'Failed to create recommendation' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      recommendation: data,
      message: 'Recommendation created successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Use session-based authentication
    const { user, error: authError } = await validateAuth(request)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

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

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { title, content, category, links } = body

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Update recommendation
    const { data, error } = await supabase
      .from('recommendations')
      .update({
        title: title.trim(),
        content,
        category: category?.trim() || null,
        links: links || [],
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating recommendation:', error)
      return NextResponse.json(
        { error: 'Failed to update recommendation' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      recommendation: data,
      message: 'Recommendation updated successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Use session-based authentication
    const { user, error: authError } = await validateAuth(request)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

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

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 },
      )
    }

    // Delete recommendation
    const { error } = await supabase
      .from('recommendations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting recommendation:', error)
      return NextResponse.json(
        { error: 'Failed to delete recommendation' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: 'Recommendation deleted successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
