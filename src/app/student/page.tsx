'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardMedia, CardFooter } from '@/components/ui/card'
import Image from 'next/image'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { StickyNote, Calendar, CheckCircle2, Link as LinkIcon, User, ChevronDown, BookOpen, Plus, Trash2, Repeat, Video, Play, Edit } from 'lucide-react'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { VideoPlayer, VideoPlayerContent, VideoPlayerControlBar, VideoPlayerPlayButton, VideoPlayerTimeRange, VideoPlayerVolumeRange, VideoPlayerMuteButton } from '@/components/ui/shadcn-io/video-player'
import { Timeline, TimelineItem, TimelineHeader, TimelineContent } from '@/components/ui/timeline-view'
import { RecurringInstancesGrid } from '@/components/ui/recurring-instances-grid'

import ColourfulText from '@/components/ui/colourful-text'

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Helper function to generate upcoming instances for recurring assignments
const getRecurringInstances = (assignment: Assignment, daysAhead: number = 7): Array<{ date: string, dayName: string }> => {
  if (!assignment.is_recurring || !assignment.recurrence_pattern) {
    return []
  }

  const instances: Array<{ date: string, dayName: string }> = []
  const today = new Date()
  const endDate = new Date()
  endDate.setDate(today.getDate() + daysAhead)

  const targetDays = assignment.recurrence_pattern.days.map(day => {
    const dayMap: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    }
    return dayMap[day.toLowerCase()]
  })

  // Generate instances starting from tomorrow
  const checkDate = new Date(today)
  checkDate.setDate(checkDate.getDate() + 1)

  while (checkDate <= endDate && instances.length < 6) { // Limit to 6 instances max
    if (targetDays.includes(checkDate.getDay())) {
      instances.push({
        date: format(checkDate, 'yyyy-MM-dd'),
        dayName: format(checkDate, 'EEE, MMM dd')
      })
    }
    checkDate.setDate(checkDate.getDate() + 1)
  }

  return instances
}

// Helper functions for date checking
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

interface Assignment {
  id: string
  title: string
  content: any
  links: Array<{ title: string; url: string; type?: 'link' | 'video' }>
  due_date: string
  completed?: boolean
  completed_at?: string
  category?: string
  is_recurring?: boolean
  recurrence_pattern?: {
    days: string[] // ['monday', 'wednesday', 'friday']
    frequency?: 'weekly' | 'daily'
  }
  recurrence_end_date?: string
  next_due_date?: string
  instance_completions?: Record<string, { completed: boolean; completed_at?: string; instance_date: string }>
}

interface Child {
  id: string
  name: string
  email: string
}

interface Note {
  id: string
  title: string
  content: any
  category: string
  created_at: string
  assignment_id?: string
}

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [selectedChildName, setSelectedChildName] = useState<string | null>(null)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedInstanceDates, setSelectedInstanceDates] = useState<Record<string, string>>({})
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editNoteData, setEditNoteData] = useState({ title: '', content: null as any })


  const { toast } = useToast()

  useEffect(() => {
    checkUserRole() // This will handle fetching assignments based on user role
    fetchNotes()
    fetchCategories()
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
      const response = await fetch('/api/assignments')
      const data = await response.json()

      if (data.profile?.role) {
        setUserRole(data.profile.role)

        if (data.profile.role === 'parent') {
          // For parents, don't load assignments initially - let first child be auto-selected
          // Clear any existing assignments to prevent showing parent's own assignments
          setAssignments([])
          fetchChildren()
        } else {
          // For students, load their assignments normally
          if (data.assignments) {
            setAssignments(data.assignments)
          }
          setLoading(false)
        }
      }
    } catch (error) {
      // Handle error silently
      setLoading(false)
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

      if (data.children && data.children.length > 0) {
        setChildren(data.children)

        // Auto-select first child if no child is currently selected
        if (!selectedChildId) {
          const firstChild = data.children[0]
          setSelectedChildId(firstChild.id)
          setSelectedChildName(firstChild.name)
          // Fetch assignments for the first child
          fetchAssignments(firstChild.id)
        }
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

  // Wrapper function that only allows toggling when appropriate
  const handleToggle = (assignmentId: string, completed: boolean, instanceDate?: string) => {
    // For students, always allow toggle
    if (userRole === 'student') {
      return toggleAssignment(assignmentId, completed, instanceDate)
    }

    // For parents, only allow toggle when a child is selected
    if (userRole === 'parent' && selectedChildId) {
      return toggleAssignment(assignmentId, completed, instanceDate)
    }

    // For parents in overview mode, show message to select a child
    if (userRole === 'parent' && !selectedChildId) {
      toast({
        title: "Select a Child",
        description: "Please select a child from the dropdown to interact with assignments",
        variant: "default"
      })
      return
    }
  }

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes')
      const data = await response.json()

      if (data.notes) {
        setNotes(data.notes)
      }
    } catch (error) {
      // Handle error silently
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/assignments')
      const data = await response.json()

    } catch (error) {
      // Handle error silently
    }
  }

  const startEditNote = (note: Note) => {
    setEditingNote(note)
    setEditNoteData({ title: note.title, content: note.content })
  }

  const cancelEditNote = () => {
    setEditingNote(null)
    setEditNoteData({ title: '', content: null })
  }

  const updateNote = async () => {
    if (!editingNote) return

    try {
      if (!editNoteData.title.trim()) {
        toast({
          title: "Error",
          description: "Please enter a title for the note",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`/api/notes?id=${editingNote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editNoteData.title.trim(),
          content: editNoteData.content,
          category: editingNote.category // Keep existing category
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "Note updated successfully",
        })
        cancelEditNote()
        fetchNotes()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update note",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive"
      })
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes?id=${noteId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "Note deleted successfully",
        })
        fetchNotes()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete note",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      })
    }
  }

  const groupNotesByCategory = () => {
    const grouped: { [key: string]: Note[] } = {}
    notes.forEach(note => {
      const category = note.category || 'General'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(note)
    })
    return grouped
  }

  const handleInstanceClick = (assignmentId: string, date: string, dayName: string) => {
    setSelectedInstanceDates(prev => ({
      ...prev,
      [assignmentId]: date
    }))

    // Also expand the main card if it's not already expanded
    if (expandedCardId !== assignmentId) {
      setExpandedCardId(assignmentId)
    }
  }

  const toggleAssignment = async (assignmentId: string, completed: boolean, instanceDate?: string) => {
    console.log(`🎯 Toggle: ${assignmentId} → completed: ${completed}, instanceDate: ${instanceDate}`)

    // Optimistic update - immediately update the UI
    setAssignments(prevAssignments => {
      const updated = prevAssignments.map(assignment => {
        if (assignment.id === assignmentId) {
          if (instanceDate && assignment.is_recurring) {
            // For recurring assignments, update instance completion
            const instanceCompletions = { ...assignment.instance_completions }
            if (completed) {
              instanceCompletions[instanceDate] = {
                completed: true,
                completed_at: new Date().toISOString(),
                instance_date: instanceDate
              }
            } else {
              delete instanceCompletions[instanceDate]
            }
            return { ...assignment, instance_completions: instanceCompletions }
          } else {
            // For regular assignments, update the main completion status
            return { ...assignment, completed, completed_at: completed ? new Date().toISOString() : undefined }
          }
        }
        return assignment
      })

      const toggledAssignment = updated.find(a => a.id === assignmentId)
      console.log(`🎯 After optimistic update: ${toggledAssignment?.title} completed = ${toggledAssignment?.completed}`)

      return updated
    })

    try {
      const response = await fetch('/api/assignments/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignmentId,
          studentId: selectedChildId,
          completed,
          instanceDate
        })
      })

      if (!response.ok) {
        // Get detailed error message
        let errorMessage = "Failed to update assignment. Please try again."
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
            if (errorData.details) {
              errorMessage += ` (${errorData.details})`
            }
          }
        } catch (e) {
          // If we can't parse the error response, use the default message
        }

        // Revert optimistic update on error
        setAssignments(prevAssignments =>
          prevAssignments.map(assignment => {
            if (assignment.id === assignmentId) {
              if (instanceDate && assignment.is_recurring) {
                // For recurring assignments, revert instance completion
                const instanceCompletions = { ...assignment.instance_completions }
                if (completed) {
                  // Was trying to complete, so remove the completion
                  delete instanceCompletions[instanceDate]
                } else {
                  // Was trying to uncomplete, so add it back
                  instanceCompletions[instanceDate] = {
                    completed: true,
                    completed_at: new Date().toISOString(),
                    instance_date: instanceDate
                  }
                }
                return { ...assignment, instance_completions: instanceCompletions }
              } else {
                // For regular assignments, revert the main completion status
                return { ...assignment, completed: !completed, completed_at: !completed ? new Date().toISOString() : undefined }
              }
            }
            return assignment
          })
        )

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        })
      } else {
        // Success - refetch assignments to ensure data is up to date
        console.log(`🎯 Successfully toggled assignment: ${assignmentId}, instanceDate: ${instanceDate}`)
        fetchAssignments(selectedChildId)
      }
    } catch (error) {
      // Revert optimistic update on error
      setAssignments(prevAssignments =>
        prevAssignments.map(assignment =>
          assignment.id === assignmentId
            ? { ...assignment, completed: !completed, completed_at: !completed ? new Date().toISOString() : undefined }
            : assignment
        )
      )

      toast({
        title: "Error",
        description: "Failed to update assignment. Please try again.",
        variant: "destructive"
      })
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
    // Completed assignments should not have red color
    if (completed) return 'text-muted-foreground'
    if (isDateToday(dateStr)) return 'text-primary'
    if (isDatePast(dateStr)) return 'text-destructive'
    return 'text-muted-foreground'
  }



  // Helper function to check if a recurring assignment should be visible for a specific date
  const shouldShowAssignmentForDate = (assignment: Assignment, dateStr: string) => {
    if (!assignment.is_recurring) {
      return !assignment.completed
    }

    // For recurring assignments, show if:
    // 1. Card is expanded, OR
    // 2. The specific date instance is not completed
    if (expandedCardId === assignment.id) {
      return true
    }

    // Check if this specific date instance is completed
    const instanceCompletions = assignment.instance_completions || {}
    const dateCompletion = instanceCompletions[dateStr]



    // Show if this date instance is not completed
    return !dateCompletion?.completed
  }

  // Simple filtering - for recurring assignments, check if they occur on the filtered date
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  const overdueAssignments = assignments.filter(a => {
    if (!a.is_recurring) {
      // For regular assignments: overdue if past due date AND not completed
      return isDatePast(a.due_date) && !a.completed
    }

    // For recurring assignments, they are "overdue" if:
    // 1. The original due date is in the past, AND
    // 2. They should occur today (based on recurrence pattern), AND  
    // 3. Today's instance is not completed
    const isOverdue = isDatePast(a.due_date)
    if (!isOverdue) {
      return false
    }

    // Check if this recurring assignment should occur today
    const shouldOccurToday = a.recurrence_pattern?.days?.some(day => {
      const dayMap: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      }
      return dayMap[day.toLowerCase()] === today.getDay()
    })

    // If it should occur today, check if today's instance is completed
    if (shouldOccurToday) {
      return shouldShowAssignmentForDate(a, todayStr)
    }

    // If it doesn't occur today, don't show it in overdue
    return false
  })

  const todayAssignments = assignments.filter(a => {
    if (!a.is_recurring) {
      return isDateToday(a.due_date) && !a.completed
    }

    // For recurring assignments, check if they should occur today and today's instance isn't completed
    // BUT exclude assignments that are overdue (original due date is in the past)
    const isOverdue = isDatePast(a.due_date)
    if (isOverdue) {
      return false // Don't show overdue recurring assignments in today's view
    }

    const shouldOccurToday = a.recurrence_pattern?.days?.some(day => {
      const dayMap: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      }
      return dayMap[day.toLowerCase()] === today.getDay()
    })

    const shouldShow = shouldOccurToday && shouldShowAssignmentForDate(a, todayStr)



    return shouldShow
  })

  const upcomingAssignments = assignments.filter(a => {
    const isFuture = isDateFuture(a.due_date)
    return isFuture && shouldShowAssignmentForDate(a, a.due_date)
  })

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <p className="text-center text-2xl"> Loding your <ColourfulText text="assignments..." /></p>
      </div>
    )
  }

  return (
    <div className="z-10 relative container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">
            {userRole === 'parent'
              ? (selectedChildName ? `${selectedChildName}'s Dashboard` : 'Parent Dashboard')
              : 'Student Dashboard'
            }
          </h1>
          {userRole === 'parent' && children.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
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
      </div>

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList variant="secondary" className="mb-2 md:mb-3">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notes">My Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <Timeline>
            {overdueAssignments.length > 0 && (
              <TimelineItem dotColor="red">
                <TimelineHeader textColor="red">Overdue</TimelineHeader>
                <TimelineContent>
                  <div className={`grid gap-4 transition-grid-cols duration-500 ${expandedCardId ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    }`}>
                    {overdueAssignments.map((assignment, index) => (
                      <AssignmentCard
                        image={true}
                        key={assignment.id}
                        assignment={assignment}
                        onToggle={handleToggle}
                        getDateLabel={getDateLabel}
                        getDateColor={getDateColor}
                        imageIndex={index}
                        expandedCardId={expandedCardId}
                        setExpandedCardId={setExpandedCardId}
                        onNoteCreated={fetchNotes}
                        selectedInstanceDate={selectedInstanceDates[assignment.id]}
                      />
                    ))}
                  </div>
                </TimelineContent>
              </TimelineItem>
            )}

            {todayAssignments.length > 0 && (
              <TimelineItem dotColor="default">
                <TimelineHeader textColor="default">Today's Assignments</TimelineHeader>
                <TimelineContent>
                  <div className={`grid gap-4 transition-[grid-template-columns] duration-600 ${expandedCardId ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    }`}>
                    {todayAssignments.map((assignment, index) => (
                      <React.Fragment key={assignment.id}>
                        <AssignmentCard
                          image={true}
                          assignment={assignment}
                          onToggle={handleToggle}
                          getDateLabel={getDateLabel}
                          getDateColor={getDateColor}
                          imageIndex={index + overdueAssignments.length}
                          expandedCardId={expandedCardId}
                          setExpandedCardId={setExpandedCardId}
                          onNoteCreated={fetchNotes}
                          assignmentNotes={notes}
                          selectedInstanceDate={selectedInstanceDates[assignment.id]}
                        />
                        {expandedCardId === assignment.id && (
                          <RecurringInstancesGrid
                            assignment={assignment}
                            imageIndex={index + overdueAssignments.length}
                            showImages={true}
                            daysAhead={7}
                            onInstanceClick={(date, dayName) => handleInstanceClick(assignment.id, date, dayName)}
                            selectedInstanceDate={selectedInstanceDates[assignment.id]}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </TimelineContent>
              </TimelineItem>
            )}

            {upcomingAssignments.length > 0 && (
              <TimelineItem dotColor="default">
                <TimelineHeader textColor="default">Upcoming</TimelineHeader>
                <TimelineContent>
                  <div className={`grid gap-4 transition-all duration-500 ${expandedCardId ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    }`}>
                    {upcomingAssignments.map((assignment, index) => (
                      <AssignmentCard
                        image={true}
                        key={assignment.id}
                        assignment={assignment}
                        onToggle={handleToggle}
                        getDateLabel={getDateLabel}
                        getDateColor={getDateColor}
                        imageIndex={index + overdueAssignments.length + todayAssignments.length}
                        expandedCardId={expandedCardId}
                        setExpandedCardId={setExpandedCardId}
                        onNoteCreated={fetchNotes}
                        assignmentNotes={notes}
                        selectedInstanceDate={selectedInstanceDates[assignment.id]}
                      />
                    ))}
                  </div>
                </TimelineContent>
              </TimelineItem>
            )}
          </Timeline>

          {assignments.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
                <p className="text-muted-foreground mb-4">
                  {userRole === 'parent'
                    ? selectedChildName
                      ? `${selectedChildName} doesn't have any assignments yet.`
                      : "No assignments have been created yet."
                    : "You don't have any assignments yet."
                  }
                </p>
                {userRole === 'parent' && (
                  <p className="text-sm text-muted-foreground">
                    Visit the <strong>Parent Dashboard</strong> to create assignments for your children.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {assignments.length > 0 && overdueAssignments.length === 0 && todayAssignments.length === 0 && upcomingAssignments.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground mb-4">
                  {userRole === 'parent'
                    ? selectedChildName
                      ? `${selectedChildName} has completed all their current assignments.`
                      : "All current assignments have been completed."
                    : "You've completed all your current assignments."
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Great work! Check back later for new assignments.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <div>

            {assignments.filter(a => isDatePast(a.due_date) || isDateToday(a.due_date)).length > 0 ? (
              <ol className="relative border-s border-grey-200 dark:border-gray-400">
                {(() => {
                  const sortedAssignments = assignments
                    .filter(assignment => isDatePast(assignment.due_date) || isDateToday(assignment.due_date))
                    .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())

                  const groupedByDate = sortedAssignments.reduce((acc, assignment) => {
                    const dateKey = format(new Date(assignment.due_date), 'EEEE, MMMM dd, yyyy')
                    if (!acc[dateKey]) {
                      acc[dateKey] = []
                    }
                    acc[dateKey].push(assignment)
                    return acc
                  }, {} as Record<string, Assignment[]>)

                  let runningIndex = 0

                  return Object.entries(groupedByDate).map(([date, dateAssignments]) => (
                    <li key={date} className="mb-10 ms-4">
                      <div className="absolute w-3 h-3 block bg-gray-200 rounded-full mt-0.5 -start-1.5 border border-gray-200 dark:border-gray-900 dark:bg-gray-700"></div>
                      <time className="block mb-2 text-lg font-medium leading-none text-foreground dark:text-foreground">{date}</time>
                      <p className="text-sm text-muted-foreground mb-4">{dateAssignments.length} assignment{dateAssignments.length !== 1 ? 's' : ''}</p>
                      <div className={`grid gap-4 transition-grid-cols duration-500 ${expandedCardId ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                        {dateAssignments.map((assignment) => {
                          const currentIndex = runningIndex++
                          return (
                            <AssignmentCard
                              image={false}
                              key={assignment.id}
                              assignment={assignment}
                              onToggle={handleToggle}
                              getDateLabel={getDateLabel}
                              getDateColor={getDateColor}
                              imageIndex={currentIndex}
                              expandedCardId={expandedCardId}
                              setExpandedCardId={setExpandedCardId}
                              onNoteCreated={fetchNotes}
                              assignmentNotes={notes}
                            />
                          )
                        })}
                      </div>
                    </li>
                  ))
                })()}
              </ol>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No past assignments yet!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
              <BookOpen className="h-6 w-6" />
              My Notes
            </h2>

            {Object.keys(groupNotesByCategory()).length > 0 ? (
              <Tabs defaultValue={Object.keys(groupNotesByCategory())[0]} className="w-full bg-background">
                <TabsList className="bg-background">
                  {Object.keys(groupNotesByCategory()).map((category) => (
                    <TabsTrigger key={category} value={category}>
                      {category} ({groupNotesByCategory()[category].length})
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(groupNotesByCategory()).map(([category, categoryNotes]) => (
                  <TabsContent key={category} value={category} className="mt-4">
                    <div className="grid gap-4 md:grid-cols-1">
                      {categoryNotes.map((note) => (
                        <Card key={note.id}>
                          <CardHeader className="mb-4">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{note.title}</CardTitle>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditNote(note)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNote(note.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <CardDescription className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(note.created_at), 'MMM dd, yyyy')}
                            </CardDescription>
                          </CardHeader>
                          {editingNote?.id === note.id ? (
                            <CardContent className="space-y-4">
                              <div>
                                <Label htmlFor={`edit-note-title-${note.id}`}>Note Title</Label>
                                <Input
                                  id={`edit-note-title-${note.id}`}
                                  value={editNoteData.title}
                                  onChange={(e) => setEditNoteData({ ...editNoteData, title: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`edit-note-content-${note.id}`}>Content</Label>
                                <div className="mt-1">
                                  <WysiwygEditor
                                    content={editNoteData.content}
                                    onChange={(content) => setEditNoteData({ ...editNoteData, content })}
                                    placeholder="Edit your note here..."
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={cancelEditNote}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={updateNote}
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </CardContent>
                          ) : (
                            note.content && (
                              <CardContent>
                                <NoteContent content={note.content} />
                              </CardContent>
                            )
                          )}
                          <CardFooter className="mt-4 flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                              <div className="mt-1 space-x-2">
                                <span>Related Assignments: </span>
                                {assignments
                                  .filter(assignment => assignment.category === note.category)
                                  .map((assignment, index, filteredAssignments) => (
                                    <code key={assignment.id} className="bg-gray-100 px-2 py-1 rounded-md font-medium">
                                      {assignment.title}
                                      {index < filteredAssignments.length - 1 ? ', ' : ''}
                                    </code>
                                  ))
                                }
                                {assignments.filter(assignment => assignment.category === note.category).length === 0 && (
                                  <span className="italic">No current assignments in this category</span>
                                )}
                              </div>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notes yet. Add notes to assignments to see them here!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
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
  setExpandedCardId,
  image,
  onNoteCreated,
  assignmentNotes = [],
  selectedInstanceDate
}: {
  image: boolean
  assignment: Assignment
  onToggle: (id: string, completed: boolean, instanceDate?: string) => void
  getDateLabel: (date: string, completed?: boolean) => string
  getDateColor: (date: string, completed?: boolean) => string
  imageIndex?: number
  expandedCardId: string | null
  setExpandedCardId: (id: string | null) => void
  onNoteCreated?: () => void
  assignmentNotes?: Note[]
  selectedInstanceDate?: string
}) {
  const expanded = expandedCardId === assignment.id
  const cardRef = useRef<HTMLDivElement>(null)
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: null as any })
  const { toast } = useToast()

  // Filter notes that belong directly to this assignment
  const relatedNotes = assignmentNotes.filter(note => {
    // First check for direct assignment association
    if (note.assignment_id) {
      return note.assignment_id === assignment.id
    }

    // Fallback to category matching for legacy notes
    const assignmentCategory = assignment.category?.trim() || 'General'
    const noteCategory = note.category?.trim() || 'General'
    return noteCategory === assignmentCategory
  })

  const images = [
    '/wildan-kurniawan-fKdoeUJBh_o-unsplash.svg',
    '/amanda-sala-oHHc3UsNrqs-unsplash.svg',
    '/eva-corbisier-6QxDZxUaScw-unsplash.svg',
    '/evelina-mitev-jV_8Fn1l1ec-unsplash.svg',
    '/gemma-evans-qVzRlSDe8OU-unsplash.svg',
    '/gemma-evans-swmWhdbcb6M-unsplash.svg',
    '/getty-images-F1sG0MZT_Ro-unsplash.svg',
    '/getty-images-pnkJbt9HVBA-unsplash.svg',
    '/lorenzo-mercanti-aKdXUkOY5ek-unsplash.svg',
    '/melanie-villette-lQDNr81EW0w-unsplash.svg',
    '/melanie-villette-Somqo53jwzE-unsplash.svg',
    '/melanie-villette-wI97g9u9XVM-unsplash.svg',
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

  const createNote = async () => {
    try {
      if (!newNote.title.trim()) {
        toast({
          title: "Error",
          description: "Please enter a title for the note",
          variant: "destructive"
        })
        return
      }

      const category = assignment.category?.trim() || 'General'

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newNote.title.trim(),
          content: newNote.content,
          category,
          assignment_id: assignment.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "Note created successfully",
        })
        setNewNote({ title: '', content: null })
        setIsCreatingNote(false)
        if (onNoteCreated) {
          onNoteCreated()
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create note",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive"
      })
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit
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

  const isCompletedRecurring = assignment.completed && assignment.is_recurring && expanded

  return (
    <Card ref={cardRef} id={`assignment-${assignment.id}`} className={`self-start overflow-hidden relative ${expanded ? 'shadow-lg ring-0!' : ''} ${assignment.completed ? 'bg-muted/30 opacity-75' : ''} ${isCompletedRecurring ? 'border-green-200 bg-green-50/50' : ''}`}>
      {image && (
        <CardMedia onClick={handleToggleExpand} className="cursor-pointer">
          <Image src={images[imageIndex % images.length]} alt={assignment.title} width={1200} height={1200} loading="eager" className="z-0 h-100 object-cover" />
        </CardMedia>
      )}
      {relatedNotes.length > 0 && (
        <span className="index-50 absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          <StickyNote className="h-3 w-3" />
          {relatedNotes.length}
        </span>
      )}
      <CardHeader onClick={handleToggleExpand} className="cursor-pointer pb-3 z-10">
        <div className="flex items-start gap-3">

          <div className="flex-1">
            <CardTitle className={`text-lg ${assignment.completed ? 'line-through text-muted-foreground' : ''} flex items-center gap-2`}>
              {assignment.title}
              {assignment.is_recurring && (
                <Repeat className="h-4 w-4 text-blue-500" />
              )}
              {isCompletedRecurring && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Will hide when closed
                </span>
              )}
              {assignment.category && (
                <span className="flex items-center gap-1 whitespace-nowrap text-xs border border-primary/30 text-foreground px-2 py-0.5 rounded-full leading-4">
                  {assignment.category}
                </span>
              )}
            </CardTitle>
            <CardDescription className={`flex items-center gap-2 mt-0 ${getDateColor(selectedInstanceDate || assignment.due_date, assignment.completed)}`}>
              <Calendar className="h-3 w-3" />
              {selectedInstanceDate ? format(new Date(selectedInstanceDate), 'MMM dd, yyyy') : getDateLabel(assignment.due_date, assignment.completed)}
              {assignment.completed && (
                <>
                  <CheckCircle2 className="h-3 w-4 te4t-green-500 ml-2" />
                  <span className="text-green-500">Completed</span>
                </>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {(assignment.content || (assignment.links && assignment.links.length > 0)) && (
        <div
          className={`overflow-auto transition-all duration-300 ease-in-out ${expanded ? 'max-h-[unset] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <CardContent className="flex flex-col gap-2 justify-end z-10 pt-0">
            <div className="space-y-3 pb-4">
              {assignment.content && (
                <EditorContent editor={editor} />
              )}

              {assignment.links && assignment.links.length > 0 && (
                <div className="flex gap-2 items-center flex-wrap">
                  {assignment.links.map((link, index) => {
                    const isVideo = link.type === 'video'
                    const videoId = isVideo ? getYouTubeVideoId(link.url) : null

                    if (isVideo && videoId) {
                      return (
                        <Dialog key={index}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer hover:text-primary/80 gap-2"
                            >
                              <Play className="h-3 w-3 text-foreground-muted" />
                              {link.title}
                            </Button>
                          </DialogTrigger>
                          <DialogContent aria-describedby={`dialog-description-${link.title}`} className=" sm:max-w-6xl">
                            <DialogHeader>
                              <DialogTitle>{link.title}</DialogTitle>
                            </DialogHeader>
                            <div className="aspect-video">
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                                title={link.title}
                                className="w-full h-full rounded-lg border"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )
                    } else {
                      return (
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
                      )
                    }
                  })}
                </div>
              )}
            </div>

            {/* Display related notes */}
            {relatedNotes.length > 0 && (
              <div className="my-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Notes ({relatedNotes.length})
                </h4>
                <div className="space-y-2">
                  {relatedNotes.map((note) => (
                    <div key={note.id} className="bg-secondary rounded-md p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-sm font-medium text-foreground-muted">{note.title}</h5>
                        <span className="text-sm font-medium text-gray-500">
                          {format(new Date(note.created_at), 'MMM dd')}
                        </span>
                      </div>
                      {note.content && (
                        <div className="text-sm text-foreground-muted">
                          <NoteContent content={note.content} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}


          </CardContent>
          <CardFooter className="flex-col space-y-4 border-t border-gray-200 dark:border-gray-400">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`assignment-${assignment.id}`}
                  checked={(() => {
                    if (!assignment.is_recurring) {
                      return assignment.completed || false
                    }

                    // For recurring assignments, determine the correct date to check
                    let dateToCheck = selectedInstanceDate

                    // If no instance date is selected, use today's date for today's assignments
                    if (!dateToCheck) {
                      const todayStr = format(new Date(), 'yyyy-MM-dd')
                      dateToCheck = todayStr
                    }

                    return assignment.instance_completions?.[dateToCheck]?.completed || false
                  })()}
                  onCheckedChange={(checked) => {
                    let instanceDate: string | undefined = undefined

                    if (assignment.is_recurring) {
                      instanceDate = selectedInstanceDate

                      // If no instance date is selected, use today's date for today's assignments  
                      if (!instanceDate) {
                        instanceDate = format(new Date(), 'yyyy-MM-dd')
                      }
                    }

                    onToggle(assignment.id, checked as boolean, instanceDate)
                  }}
                  className="h-5 w-5 hover:ring-1 hover:ring-ring/50 cursor-pointer"
                />
                <label
                  htmlFor={`assignment-${assignment.id}`}
                  className="text-sm text-muted-foreground select-none cursor-pointer"
                >
                  {assignment.completed ? 'Done' : 'I\'m Done'}
                </label>
              </div>

              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsCreatingNote(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            </div>

            {isCreatingNote && (
              <div className="w-full justify-end space-y-3" onClick={(e) => e.stopPropagation()}>
                <div>
                  <Label htmlFor={`note-title-${assignment.id}`}>Note Title</Label>
                  <Input
                    id={`note-title-${assignment.id}`}
                    placeholder="Enter note title..."
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`note-content-${assignment.id}`}>Content</Label>
                  <div className="mt-1">
                    <WysiwygEditor
                      content={newNote.content}
                      onChange={(content) => setNewNote({ ...newNote, content })}
                      placeholder="Write your note here..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewNote({ title: '', content: null })
                      setIsCreatingNote(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createNote}
                  >
                    Save Note
                  </Button>
                </div>
              </div>
            )}
          </CardFooter>
        </div>
      )}
    </Card>

  )
}

// Separate component for rendering note content to avoid hook rule violations
function NoteContent({ content }: { content: any }) {
  const editor = useEditor({
    extensions: [
      StarterKit
    ],
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none'
      }
    }
  })

  return <EditorContent editor={editor} />
}
