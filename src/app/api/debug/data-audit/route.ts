import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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
        error: 'Audit access denied',
        debug: { userEmail, expectedPattern: 'justice*', userId: user.id }
      }, { status: 403 })
    }

    // Get user profile (might not exist or have role set yet)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email, name')
      .eq('id', user.id)
      .single()

    // Profile might not exist yet, that's okay for audit

    const auditResults = {
      currentUser: {
        email: profile?.email || user.email,
        name: profile?.name || user.user_metadata?.full_name || 'Unknown',
        role: profile?.role || 'No role set',
        id: user.id
      },
      issues: []
    }

    // 1. Check for role issues
    try {
      const validRoles = ['parent', 'student', 'admin']
      const { data: profilesWithInvalidRoles, error: roleError } = await supabase
        .from('profiles')
        .select('id, email, name, role')
        .not('role', 'in', `(${validRoles.join(',')})`)


      if (roleError) {
        auditResults.issues.push({
          type: 'QUERY_ERROR',
          count: 1,
          details: { query: 'profiles role check', error: roleError.message }
        })
      } else if (profilesWithInvalidRoles && profilesWithInvalidRoles.length > 0) {
        auditResults.issues.push({
          type: 'INVALID_ROLES',
          count: profilesWithInvalidRoles.length,
          details: profilesWithInvalidRoles
        })
      }
    } catch (error) {
      console.error('Role check failed:', error)
      auditResults.issues.push({
        type: 'QUERY_ERROR',
        count: 1,
        details: { query: 'profiles role check', error: (error as Error).message }
      })
    }

    // 2. Check for orphaned children (students with invalid parent_id)
    const { data: orphanedChildren } = await supabase
      .from('profiles')
      .select(`
        id, email, name, role, parent_id,
        parent:profiles!profiles_parent_id_fkey(id, email, name, role)
      `)
      .eq('role', 'student')

    const orphans = orphanedChildren?.filter(child =>
      !child.parent || child.parent.role !== 'parent'
    ) || []

    if (orphans.length > 0) {
      auditResults.issues.push({
        type: 'ORPHANED_CHILDREN',
        count: orphans.length,
        details: orphans.map(child => ({
          id: child.id,
          email: child.email,
          name: child.name,
          parent_id: child.parent_id,
          parent_exists: !!child.parent,
          parent_role: child.parent?.role
        }))
      })
    }

    // 3. Check for cross-family assignment contamination
    const { data: assignmentAudit } = await supabase
      .from('assignments')
      .select(`
        id, title, parent_id,
        creator:profiles!assignments_parent_id_fkey(id, email, name, role),
        student_assignments(
          student_id,
          student:profiles!student_assignments_student_id_fkey(
            id, email, name, role, parent_id,
            parent:profiles!profiles_parent_id_fkey(id, email, name, role)
          )
        )
      `)

    const crossFamilyAssignments = []
    assignmentAudit?.forEach(assignment => {
      assignment.student_assignments?.forEach(sa => {
        const student = sa.student
        const studentParent = student?.parent
        const assignmentCreator = assignment.creator

        // Check if assignment creator is different from student's parent
        if (assignmentCreator && studentParent &&
          assignmentCreator.id !== studentParent.id &&
          assignmentCreator.role !== 'admin') {
          crossFamilyAssignments.push({
            assignment_id: assignment.id,
            assignment_title: assignment.title,
            created_by: {
              email: assignmentCreator.email,
              name: assignmentCreator.name,
              role: assignmentCreator.role
            },
            assigned_to: {
              email: student.email,
              name: student.name
            },
            student_parent: {
              email: studentParent.email,
              name: studentParent.name
            }
          })
        }
      })
    })

    if (crossFamilyAssignments.length > 0) {
      auditResults.issues.push({
        type: 'CROSS_FAMILY_ASSIGNMENTS',
        count: crossFamilyAssignments.length,
        details: crossFamilyAssignments
      })
    }

    // 4. Check your specific children accounts
    const { data: yourChildren } = await supabase
      .from('profiles')
      .select('id, email, name, role, parent_id')
      .like('email', '%justice%')
      .eq('role', 'student')

    if (yourChildren) {
      auditResults.yourChildren = yourChildren.map(child => ({
        ...child,
        has_valid_parent: child.parent_id === user.id
      }))
    }

    return NextResponse.json(auditResults)

  } catch (error) {
    console.error('Data audit error:', error)
    return NextResponse.json(
      { error: 'Audit failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
