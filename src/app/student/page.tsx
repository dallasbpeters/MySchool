'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle2, Circle, Link as LinkIcon, User } from 'lucide-react'
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

interface Assignment {
  id: string
  title: string
  content: any
  links: Array<{ title: string; url: string }>
  due_date: string
  completed?: boolean
  completed_at?: string
}

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    fetchAssignments()
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUserRole(profile.role || '')
    }
  }

  const fetchAssignments = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('parent_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) return

    let parentId = profile.role === 'parent' ? user.id : profile.parent_id

    const { data: assignmentsData, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('parent_id', parentId)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Error fetching assignments:', error)
      setLoading(false)
      return
    }

    const { data: completions } = await supabase
      .from('student_assignments')
      .select('assignment_id, completed, completed_at')
      .eq('student_id', user.id)

    const completionMap = new Map(
      completions?.map(c => [c.assignment_id, c]) || []
    )

    const assignmentsWithCompletion = assignmentsData?.map(a => ({
      ...a,
      links: Array.isArray(a.links) ? a.links as Array<{ title: string; url: string }> : [],
      completed: completionMap.get(a.id)?.completed || false,
      completed_at: completionMap.get(a.id)?.completed_at
    })) || []

    setAssignments(assignmentsWithCompletion)
    setLoading(false)
  }

  const toggleAssignment = async (assignmentId: string, completed: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existing } = await supabase
      .from('student_assignments')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .single()

    if (existing) {
      await supabase
        .from('student_assignments')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('assignment_id', assignmentId)
        .eq('student_id', user.id)
    } else {
      await supabase
        .from('student_assignments')
        .insert({
          assignment_id: assignmentId,
          student_id: user.id,
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
    }

    fetchAssignments()
  }

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isPast(date)) return 'Overdue'
    return format(date, 'MMM dd')
  }

  const getDateColor = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isPast(date) && !isToday(date)) return 'text-destructive'
    if (isToday(date)) return 'text-primary'
    if (isTomorrow(date)) return 'text-orange-500'
    return 'text-muted-foreground'
  }

  const todayAssignments = assignments.filter(a => isToday(new Date(a.due_date)))
  const upcomingAssignments = assignments.filter(a => isFuture(new Date(a.due_date)) && !isToday(new Date(a.due_date)))
  const overdueAssignments = assignments.filter(a => isPast(new Date(a.due_date)) && !isToday(new Date(a.due_date)) && !a.completed)

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="text-center py-8">Loading assignments...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Assignments</h1>
        {userRole === 'parent' && (
          <Button
            variant="outline"
            onClick={() => window.location.href = '/parent'}
            className="gap-2"
          >
            <User className="h-4 w-4" />
            Switch to Parent View
          </Button>
        )}
      </div>

      {overdueAssignments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-destructive">Overdue</h2>
          <div className="space-y-3">
            {overdueAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onToggle={toggleAssignment}
                getDateLabel={getDateLabel}
                getDateColor={getDateColor}
              />
            ))}
          </div>
        </div>
      )}

      {todayAssignments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Today's Assignments</h2>
          <div className="space-y-3">
            {todayAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onToggle={toggleAssignment}
                getDateLabel={getDateLabel}
                getDateColor={getDateColor}
              />
            ))}
          </div>
        </div>
      )}

      {upcomingAssignments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcomingAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onToggle={toggleAssignment}
                getDateLabel={getDateLabel}
                getDateColor={getDateColor}
              />
            ))}
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No assignments yet!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AssignmentCard({ 
  assignment, 
  onToggle, 
  getDateLabel, 
  getDateColor 
}: {
  assignment: Assignment
  onToggle: (id: string, completed: boolean) => void
  getDateLabel: (date: string) => string
  getDateColor: (date: string) => string
}) {
  const [expanded, setExpanded] = useState(false)
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-primary underline'
        }
      })
    ],
    content: assignment.content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none'
      }
    }
  })

  return (
    <Card className={assignment.completed ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={assignment.completed}
            onCheckedChange={(checked) => onToggle(assignment.id, checked as boolean)}
            className="mt-1"
          />
          <div className="flex-1">
            <CardTitle className={`text-lg ${assignment.completed ? 'line-through' : ''}`}>
              {assignment.title}
            </CardTitle>
            <CardDescription className={`flex items-center gap-2 mt-1 ${getDateColor(assignment.due_date)}`}>
              <Calendar className="h-3 w-3" />
              {getDateLabel(assignment.due_date)}
              {assignment.completed && (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-500 ml-2" />
                  <span className="text-green-500">Completed</span>
                </>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      {(assignment.content || (assignment.links && assignment.links.length > 0)) && (
        <CardContent>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="mb-2"
          >
            {expanded ? 'Hide Details' : 'Show Details'}
          </Button>
          
          {expanded && (
            <div className="space-y-3">
              {assignment.content && (
                <div className="border rounded-lg p-3 bg-muted/30">
                  <EditorContent editor={editor} />
                </div>
              )}
              
              {assignment.links && assignment.links.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">Resources:</span>
                  {assignment.links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <LinkIcon className="h-3 w-3" />
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary underline hover:text-primary/80"
                      >
                        {link.title}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}