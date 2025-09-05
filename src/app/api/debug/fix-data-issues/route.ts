import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is authorized (by email from auth, not profile)
    const userEmail = user.email

    // Allow access for Dallas
    const isAuthorized = userEmail === 'dallaspeters@gmail.com'

    if (!isAuthorized) {
      return NextResponse.json({
        error: 'Fix access denied',
        debug: { userEmail, expectedPattern: 'justice*', userId: user.id }
      }, { status: 403 })
    }

    const results = { action, success: false, message: '', details: {} }

    switch (action) {
      case 'fix_your_children_parent_id':
        // Fix parent_id for children accounts ending in 2 that belong to you
        const { data: childrenToFix } = await supabase
          .from('profiles')
          .select('id, email, name, parent_id')
          .like('email', '%2@%') // Accounts ending in 2
          .eq('role', 'student')

        if (childrenToFix) {
          const updates = []
          for (const child of childrenToFix) {
            // Update parent_id to point to you
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ parent_id: user.id })
              .eq('id', child.id)

            if (updateError) {
              updates.push({ email: child.email, status: 'failed', error: updateError.message })
            } else {
              updates.push({ email: child.email, status: 'fixed' })
            }
          }

          results.success = true
          results.message = `Fixed parent_id for ${updates.filter(u => u.status === 'fixed').length} children`
          results.details = { updates }
        }
        break

      case 'remove_cross_family_assignments':
        // Remove assignments from other families assigned to your children
        const { data: yourChildrenIds } = await supabase
          .from('profiles')
          .select('id')
          .eq('parent_id', user.id)
          .eq('role', 'student')

        if (yourChildrenIds) {
          const childIds = yourChildrenIds.map(child => child.id)

          // Find student_assignments where the assignment creator is not you
          const { data: contaminated } = await supabase
            .from('student_assignments')
            .select(`
              id, assignment_id, student_id,
              assignment:assignments!inner(parent_id, title)
            `)
            .in('student_id', childIds)
            .neq('assignment.parent_id', user.id)

          if (contaminated) {
            const removals = []
            for (const sa of contaminated) {
              const { error: deleteError } = await supabase
                .from('student_assignments')
                .delete()
                .eq('id', sa.id)

              if (deleteError) {
                removals.push({
                  assignment_title: sa.assignment.title,
                  status: 'failed',
                  error: deleteError.message
                })
              } else {
                removals.push({
                  assignment_title: sa.assignment.title,
                  status: 'removed'
                })
              }
            }

            results.success = true
            results.message = `Removed ${removals.filter(r => r.status === 'removed').length} cross-family assignments`
            results.details = { removals }
          }
        }
        break

      case 'upgrade_to_admin':
        // Upgrade your account to admin role (if supported)
        const { error: upgradeError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', user.id)

        if (upgradeError) {
          results.message = `Failed to upgrade to admin: ${upgradeError.message}`
          results.details = { error: upgradeError }
        } else {
          results.success = true
          results.message = 'Successfully upgraded to admin role'
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Fix data issues error:', error)
    return NextResponse.json(
      { error: 'Fix failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
