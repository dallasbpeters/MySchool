'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardMedia } from '@/components/ui/card'
import Image from 'next/image'
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
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  useEffect(() => {
    fetchAssignments()
    checkUserRole()
  }, [])

  // Handle hash-based scrolling for notifications
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash
      if (hash.startsWith('#assignment-')) {
        const assignmentId = hash.replace('#assignment-', '')
        setTimeout(() => {
          const element = document.getElementById(`assignment-${assignmentId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
            // Clear the hash after scrolling
            window.history.replaceState(null, null, window.location.pathname)
          }
        }, 500) // Wait for assignments to load and render
      }
    }

    // Handle initial hash and hash changes
    handleHashScroll()
    window.addEventListener('hashchange', handleHashScroll)

    return () => {
      window.removeEventListener('hashchange', handleHashScroll)
    }
  }, [assignments])

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

  const getDateLabel = (dateStr: string, completed?: boolean) => {
    // Check if it's today first - today's assignments should never show as "Overdue"
    if (isDateToday(dateStr)) {
      return format(new Date(dateStr), 'MMM dd')
    }

    const date = new Date(dateStr)
    if (isTomorrow(date)) return 'Tomorrow'

    // Check if it's in the past (but not today) and not completed
    if (isDatePast(dateStr) && !completed) {
      return 'Overdue'
    }

    return format(date, 'MMM dd')
  }

  const getDateColor = (dateStr: string, completed?: boolean) => {
    const date = new Date(dateStr)
    // Completed assignments should not have red color
    if (completed) return 'text-muted-foreground'
    if (isPast(date) && !isToday(date)) return 'text-destructive'
    if (isToday(date)) return 'text-primary'
    if (isTomorrow(date)) return 'text-orange-500'
    return 'text-muted-foreground'
  }

  // Helper function to check if a date string represents today
  const isDateToday = (dateStr: string) => {
    // For YYYY-MM-DD format, add time to avoid timezone issues
    const assignmentDate = new Date(dateStr + 'T12:00:00')
    const today = new Date()

    // Compare year, month, and day
    return assignmentDate.getFullYear() === today.getFullYear() &&
      assignmentDate.getMonth() === today.getMonth() &&
      assignmentDate.getDate() === today.getDate()
  }

  const isDateFuture = (dateStr: string) => {
    // For YYYY-MM-DD format, add time to avoid timezone issues  
    const assignmentDate = new Date(dateStr + 'T12:00:00')
    const today = new Date()

    // Compare dates - future means after today
    return assignmentDate.getFullYear() > today.getFullYear() ||
      (assignmentDate.getFullYear() === today.getFullYear() &&
        assignmentDate.getMonth() > today.getMonth()) ||
      (assignmentDate.getFullYear() === today.getFullYear() &&
        assignmentDate.getMonth() === today.getMonth() &&
        assignmentDate.getDate() > today.getDate())
  }

  const isDatePast = (dateStr: string) => {
    // For YYYY-MM-DD format, add time to avoid timezone issues
    const assignmentDate = new Date(dateStr + 'T12:00:00')
    const today = new Date()

    // Compare dates - past means before today
    return assignmentDate.getFullYear() < today.getFullYear() ||
      (assignmentDate.getFullYear() === today.getFullYear() &&
        assignmentDate.getMonth() < today.getMonth()) ||
      (assignmentDate.getFullYear() === today.getFullYear() &&
        assignmentDate.getMonth() === today.getMonth() &&
        assignmentDate.getDate() < today.getDate())
  }

  // Filter assignments into categories - each assignment should only appear in one category
  const overdueAssignments = assignments.filter(a => {
    // Overdue: past dates that aren't completed
    return isDatePast(a.due_date) && !a.completed
  })

  const todayAssignments = assignments.filter(a => {
    // Today: assignments with today's date only
    return isDateToday(a.due_date)
  })

  const upcomingAssignments = assignments.filter(a => {
    // Upcoming: future dates only
    return isDateFuture(a.due_date)
  })

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <p className="text-center text-2xl"> Loding your <ColourfulText text="assignments..." /></p>
      </div>
    )
  }

  return (
    <div className="z-10 relative container mx-auto p-4 max-w-5xl">
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

      <ol className="relative  border-s border-grey-200 dark:border-gray-400">
        {overdueAssignments.length > 0 && (
          <li className="mb-10 ms-4">
            <div className="absolute w-3 h-3 block bg-red-500 rounded-full mt-0.5 -start-1.5 border border-red-500 dark:border-red-500 dark:bg-red-500"></div>
            <time className="block mb-2 text-lg font-medium leading-none text-red-500 dark:text-red-500">Overdue</time>
            <div className={`grid gap-4 transition-grid-cols duration-500 ${expandedCardId ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
              }`}>
              {overdueAssignments.map((assignment, index) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onToggle={toggleAssignment}
                  getDateLabel={getDateLabel}
                  getDateColor={getDateColor}
                  imageIndex={index}
                  expandedCardId={expandedCardId}
                  setExpandedCardId={setExpandedCardId}
                />
              ))}
            </div>
          </li>
        )}

        {todayAssignments.length > 0 && (
          <li className="mb-8 ms-4">
            <div className="absolute w-3 h-3 block bg-gray-200 rounded-full mt-0.5 -start-1.5 border border-gray-200 dark:border-gray-900 dark:bg-gray-700"></div>
            <time className="block mb-2 text-lg font-medium leading-none text-foreground  dark:text-foreground">Today's Assignments</time>
            <div className="mb-6">
              <div className={`grid gap-4 transition-[grid-template-columns] duration-600 ${expandedCardId ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                }`}>
                {todayAssignments.map((assignment, index) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onToggle={toggleAssignment}
                    getDateLabel={getDateLabel}
                    getDateColor={getDateColor}
                    imageIndex={index + overdueAssignments.length}
                    expandedCardId={expandedCardId}
                    setExpandedCardId={setExpandedCardId}
                  />
                ))}
              </div>
            </div>
          </li>
        )}
        <li className="mb-8 ms-4">
          <div className="absolute w-3 h-3 block bg-gray-200 rounded-full mt-0.5 -start-1.5 border border-gray-200 dark:border-gray-900 dark:bg-gray-700"></div>
          <time className="block mb-2 text-lg font-medium leading-none text-foreground dark:text-foreground">Upcoming</time>
          {upcomingAssignments.length > 0 && (
            <div className="mb-6">
              <div className={`grid gap-4 transition-all duration-500 ${expandedCardId ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                }`}>
                {upcomingAssignments.map((assignment, index) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onToggle={toggleAssignment}
                    getDateLabel={getDateLabel}
                    getDateColor={getDateColor}
                    imageIndex={index + overdueAssignments.length + todayAssignments.length}
                    expandedCardId={expandedCardId}
                    setExpandedCardId={setExpandedCardId}
                  />
                ))}
              </div>
            </div>
          )}
        </li>
      </ol>





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
  getDateColor,
  imageIndex = 0,
  expandedCardId,
  setExpandedCardId
}: {
  assignment: Assignment
  onToggle: (id: string, completed: boolean) => void
  getDateLabel: (date: string, completed?: boolean) => string
  getDateColor: (date: string, completed?: boolean) => string
  imageIndex?: number
  expandedCardId: string | null
  setExpandedCardId: (id: string | null) => void
}) {
  const expanded = expandedCardId === assignment.id
  const cardRef = useRef<HTMLDivElement>(null)
  const images = [
    'https://plus.unsplash.com/premium_vector-1689096635358-c37d266c4f31?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_vector-1707445731646-daf31bafc5fe?q=80&w=1022&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/vector-1747069104000-d096a1c61a88?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_vector-1725479330824-84da5f16167e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDEwfHx8ZW58MHx8fHx8',
    'https://plus.unsplash.com/premium_vector-1713176941256-ea505e793196?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDE2fHx8ZW58MHx8fHx8',
    'https://plus.unsplash.com/premium_vector-1736807327185-9149603c2701?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDIxfHx8ZW58MHx8fHx8',
    'https://images.unsplash.com/vector-1738292955262-61c36b210ca5?q=80&w=986&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_vector-1754029090817-92b24c82d730?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDMxfHx8ZW58MHx8fHx8',
    'https://plus.unsplash.com/premium_vector-1689096737724-48e35df8a907?q=80&w=3520&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_vector-1689096917660-9041bba693dc?q=80&w=3520&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_vector-1689096917660-9041bba693dc?q=80&w=3520&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ]

  const handleToggleExpand = () => {
    // Toggle expanded state
    if (expanded) {
      setExpandedCardId(null)
    } else {
      setExpandedCardId(assignment.id)

      // Scroll to card when expanding
      setTimeout(() => {
        cardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'center',
        })
      }, 400) // Increased delay to allow for grid transition
    }
  }

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
    <Card ref={cardRef} id={`assignment-${assignment.id}`} className={`self-start overflow-hidden relative ${expanded ? 'shadow-lg ring-0!' : ''} ${assignment.completed ? 'bg-muted/30 opacity-75' : ''}`}>
      <CardMedia onClick={handleToggleExpand} className="cursor-pointer">
        <Image src={images[imageIndex % images.length]} alt={assignment.title} width={1200} height={1200} loading="eager" className="z-0 h-100 object-cover" />
      </CardMedia>
      <CardHeader onClick={handleToggleExpand} className="cursor-pointer pb-3 z-10">
        <div className="flex items-start gap-3">

          <div className="flex-1">
            <CardTitle className={`text-lg ${assignment.completed ? 'line-through text-muted-foreground' : ''}`}>
              {assignment.title}
            </CardTitle>
            <CardDescription className={`flex items-center gap-2 mt-0 ${getDateColor(assignment.due_date, assignment.completed)}`}>
              <Calendar className="h-3 w-3" />
              {getDateLabel(assignment.due_date, assignment.completed)}
              {assignment.completed && (
                <>
                  <CheckCircle2 className="h-3 w-4 te4t-green-500 ml-2" />
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
              className="cursor-pointer h-5 w-5 hover:ring-1 hover:ring-ring/50"
            />
            <label
              htmlFor={`assignment-${assignment.id}`}
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              {assignment.completed ? 'Done' : 'I\'m Done'}
            </label>
          </div>
        </div>
      </CardHeader>

      {(assignment.content || (assignment.links && assignment.links.length > 0)) && (
        <div
          className={`overflow-auto transition-all duration-300 ease-in-out ${expanded ? 'max-h-[100vh] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <CardContent className="flex flex-col gap-2 justify-end z-10 pt-0">
            <div className="space-y-3">
              {assignment.content && (
                <EditorContent editor={editor} />
              )}

              {assignment.links && assignment.links.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">Resources:</span>
                  {assignment.links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(link.url, '_blank')
                        }}
                        rel="noopener noreferrer"
                        className="cursor-pointer hover:text-primary/80"
                      >
                        <LinkIcon className="h-3 w-3" />
                        {link.title}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </div>
      )}
    </Card>
  )
}
