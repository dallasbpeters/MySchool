'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Calendar, CheckCircle2, Link as LinkIcon, User, ChevronDown } from 'lucide-react'
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

import ColourfulText from '@/components/ui/colourful-text'

interface Assignment {
  id: string
  title: string
  content: any
  links: Array<{ title: string; url: string }>
  due_date: string
  completed?: boolean
  completed_at?: string
}

interface Child {
  id: string
  name: string
  email: string
}

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [selectedChildName, setSelectedChildName] = useState<string | null>(null)

  useEffect(() => {
    fetchAssignments()
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const response = await fetch('/api/user')
      const data = await response.json()

      if (data.user?.user_metadata?.role) {
        setUserRole(data.user.user_metadata.role)
        // If parent, fetch their children
        if (data.user.user_metadata.role === 'parent') {
          fetchChildren()
        }
      }
    } catch (error) {
      // Handle error silently
    }
  }

  const fetchAssignments = async (childId?: string) => {
    try {
      const url = childId ? `/api/assignments?childId=${childId}` : '/api/assignments'
      const response = await fetch(url)
      const data = await response.json()

      if (data.assignments) {
        setAssignments(data.assignments)
        if (data.profile?.role) {
          setUserRole(data.profile.role)
        }
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/children')
      const data = await response.json()

      if (data.children) {
        setChildren(data.children)
      }
    } catch (error) {
      // Handle error silently
    }
  }

  const switchToChild = (childId: string, childName: string) => {
    setSelectedChildId(childId)
    setSelectedChildName(childName)
    fetchAssignments(childId)
  }

  const switchToOwnView = () => {
    setSelectedChildId(null)
    setSelectedChildName(null)
    fetchAssignments()
  }

  const toggleAssignment = async (assignmentId: string, completed: boolean) => {
    try {
      const response = await fetch('/api/assignments/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignmentId,
          studentId: selectedChildId || undefined,
          completed
        })
      })

      if (response.ok) {
        // Refresh assignments for the current view
        fetchAssignments(selectedChildId || undefined)
      } else {
        console.error('Failed to toggle assignment')
      }
    } catch (error) {
      console.error('Error toggling assignment:', error)
    }
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
        <p className="text-center text-large"> Loding your <ColourfulText text="assignments..." /></p>
      </div>
    )
  }

  return (
    <div className="z-10 relative container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {selectedChildName ? `${selectedChildName}'s Assignments` : 'Assignments'}
        </h1>
        {userRole === 'parent' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <User className="h-4 w-4" />
                {selectedChildName || 'View as'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!selectedChildId && (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  My View (Current)
                </DropdownMenuItem>
              )}
              {selectedChildId && (
                <DropdownMenuItem onClick={switchToOwnView}>
                  My View
                </DropdownMenuItem>
              )}
              {children.map((child) => (
                <DropdownMenuItem
                  key={child.id}
                  onClick={() => switchToChild(child.id, child.name)}
                  disabled={selectedChildId === child.id}
                  className={selectedChildId === child.id ? 'text-muted-foreground' : ''}
                >
                  {child.name} {selectedChildId === child.id && '(Current)'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
    immediatelyRender: false,
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

          <div className="flex-1">
            <CardTitle className={`text-lg ${assignment.completed ? 'line-through text-muted-foreground' : ''}`}>
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
          <div className="flex items-center gap-2">
            <Checkbox
              id={`assignment-${assignment.id}`}
              checked={assignment.completed}
              onCheckedChange={(checked) => onToggle(assignment.id, checked as boolean)}
              className="h-5 w-5"
            />
            <label
              htmlFor={`assignment-${assignment.id}`}
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              {assignment.completed ? 'Done' : 'Mark complete'}
            </label>
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
            {expanded ? 'Hide Assignment' : 'View Assignment'}
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
