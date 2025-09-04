import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const studentId = url.searchParams.get('studentId') // Allow specifying student ID

    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ notes: [], error: 'No user found' })
    }

    // Determine which student's notes to fetch
    const targetStudentId = studentId || user.id

    // If studentId is provided, verify the user has access to view that student's notes
    if (studentId && studentId !== user.id) {
      // Get user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'parent') {
        // Verify this child belongs to the parent
        const { data: child } = await supabase
          .from('profiles')
          .select('parent_id')
          .eq('id', studentId)
          .single()

        if (!child || child.parent_id !== user.id) {
          return NextResponse.json({ notes: [], error: 'Access denied' })
        }
      } else if (profile?.role !== 'admin') {
        // Only admins and parents can view other students' notes
        return NextResponse.json({ notes: [], error: 'Access denied' })
      }
    }

    let query = supabase
      .from('assignment_notes')
      .select('*')
      .eq('student_id', targetStudentId)
      .order('created_at', { ascending: false })

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category)
    }

    const { data: notes, error: notesError } = await query

    if (notesError) {
      return NextResponse.json({ notes: [], error: notesError.message })
    }

    return NextResponse.json({ notes: notes || [] })

  } catch (error: unknown) {
    console.error("API error:", error)
    return NextResponse.json({ notes: [], error: 'Internal server error' })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      category,
      title,
      content,
      assignment_id
    } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Note title is required' },
        { status: 400 }
      )
    }

    if (!category?.trim()) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to create notes' },
        { status: 401 }
      )
    }

    // Create the note
    const { data: noteData, error: noteError } = await supabase
      .from('assignment_notes')
      .insert({
        student_id: user.id,
        category: category.trim(),
        title: title.trim(),
        content: content,
        assignment_id: assignment_id || null
      })
      .select()
      .single()

    if (noteError) {
      return NextResponse.json(
        { error: `Failed to create note: ${noteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      note: noteData,
      message: `Note "${title.trim()}" created successfully`
    })

  } catch (error: unknown) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const noteId = url.searchParams.get('id')

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    const {
      title,
      content
    } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Note title is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to update notes' },
        { status: 401 }
      )
    }

    // Update the note
    const { data: noteData, error: noteError } = await supabase
      .from('assignment_notes')
      .update({
        title: title.trim(),
        content: content
      })
      .eq('id', noteId)
      .eq('student_id', user.id) // Ensure user can only update their own notes
      .select()
      .single()

    if (noteError) {
      return NextResponse.json(
        { error: `Failed to update note: ${noteError.message}` },
        { status: 500 }
      )
    }

    if (!noteData) {
      return NextResponse.json(
        { error: 'Note not found or you do not have permission to update it' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      note: noteData,
      message: `Note "${title.trim()}" updated successfully`
    })

  } catch (error: unknown) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const noteId = url.searchParams.get('id')

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete notes' },
        { status: 401 }
      )
    }

    // Delete the note
    const { error: deleteError } = await supabase
      .from('assignment_notes')
      .delete()
      .eq('id', noteId)
      .eq('student_id', user.id) // Ensure user can only delete their own notes

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete note: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    })

  } catch (error: unknown) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
