'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { LocalDock, type TabValue } from '@/components/local-dock'
import { Dock, DockItem, DockIcon, DockLabel } from '@/components/ui/dock'
import PageGrid from '@/components/page-grid'
import { useToast } from '@/hooks/use-toast'

// Import our new components
import { StudentHeader } from '@/components/student/student-header'
import { AssignmentList } from '@/components/student/assignment-list'
import { AssignmentTimeline } from '@/components/student/assignment-timeline'
import { NotesTab } from '@/components/student/notes-tab'
import { AssignmentService } from '@/services/assignment-service'
import { NoteService } from '@/services/note-service'
import ExpandingCardContainer from '@/components/expanding-card'
import { NotebookText, BookA, History, ThumbsUp } from 'lucide-react'

interface Assignment {
  id: string
  title: string
  content: string | null
  links: Array<{ title: string; url: string; type?: 'link' | 'video' }>
  due_date: string
  completed?: boolean
  completed_at?: string
  category?: string
  is_recurring?: boolean
  recurrence_pattern?: {
    days: string[]
    frequency: 'weekly' | 'daily'
  }
  recurrence_end_date?: string
  next_due_date?: string
  instance_completions?: Record<
    string,
    { completed: boolean; completed_at?: string; instance_date: string }
  >
}

interface Child {
  id: string
  name: string
  email: string
  parent_name?: string
}

interface Note {
  id: string
  title: string
  content: string | null
  category: string
  created_at: string
  assignment_id?: string
}

interface Recommendation {
  id: string
  title: string
  content?: string
  category?: string
  links?: Array<{ title: string; url: string; type?: 'link' | 'video' }>
  created_at: string
  updated_at: string
  created_by: string
  parent_name?: string
}

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<string>('assignments')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [userRole, setUserRole] = useState<string>('')
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [selectedChildName, setSelectedChildName] = useState<string | null>(
    null,
  )
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [_selectedInstanceDates, setSelectedInstanceDates] = useState<
    Record<string, string>
  >({})
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editNoteData, setEditNoteData] = useState<{
    title: string
    content: string
  }>({ title: '', content: '' })
  const [isLoading, setIsLoading] = useState(true)

  const { toast } = useToast()

  // Handle tab changes and reset expanded card
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    setExpandedCardId(null) // Reset expanded card when switching tabs
  }

  // Consolidated dashboard data fetch
  const fetchDashboardData = useCallback(
    async (childId?: string) => {
      try {
        setIsLoading(true)
        const url = childId
          ? `/api/dashboard?childId=${childId}`
          : '/api/dashboard'

        const response = await fetch(url)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch dashboard data')
        }

        // Set all data from single response
        setUserRole(data.user?.role || '')
        setAssignments(data.assignments || [])
        setRecommendations(data.recommendations || [])
        setNotes(data.notes || [])
        setChildren(data.children || [])

        if (data.selectedChild) {
          setSelectedChildId(data.selectedChild.id)
          setSelectedChildName(data.selectedChild.name)
        }

        return data
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast({
          title: 'Loading Error',
          description: 'Failed to load dashboard data. Please try refreshing.',
          variant: 'destructive',
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  // Fetch data for specific child
  const fetchChildData = useCallback(
    async (childId: string) => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/child-data?childId=${childId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch child data')
        }

        setAssignments(data.assignments || [])
        setRecommendations(data.recommendations || [])
        setNotes(data.notes || [])
      } catch (error) {
        console.error('Error fetching child data:', error)
        toast({
          title: 'Loading Error',
          description: 'Failed to load child data.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  // Simplified assignment refresh for toggles
  const refreshAssignments = useCallback(async () => {
    try {
      const childId = selectedChildId
      const url = childId
        ? `/api/assignments?childId=${childId}`
        : '/api/assignments'
      const response = await fetch(url)
      const data = await response.json()

      if (data.assignments) {
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Error refreshing assignments:', error)
    }
  }, [selectedChildId])

  // Simplified note refresh
  const refreshNotes = useCallback(async () => {
    try {
      const studentId = selectedChildId
      const url = studentId ? `/api/notes?studentId=${studentId}` : '/api/notes'
      const response = await fetch(url)
      const data = await response.json()

      if (data.notes) {
        setNotes(data.notes)
      }
    } catch (error) {
      console.error('Error refreshing notes:', error)
    }
  }, [selectedChildId])

  // Remove individual fetch functions - now handled by consolidated endpoints

  // Initialize data with single consolidated call
  useEffect(() => {
    fetchDashboardData().catch(() => {
      // Error handling is done in fetchDashboardData
    })
  }, [fetchDashboardData])

  const handleChildSelect = (childId: string, childName: string) => {
    setSelectedChildId(childId)
    setSelectedChildName(childName)
    fetchChildData(childId)
  }

  const _handleToggle = async (assignmentId: string, instanceDate?: string) => {
    // Find the assignment to determine current completion state
    const assignment = assignments.find((a) => a.id === assignmentId)
    if (!assignment) return

    console.log('BEFORE TOGGLE - Assignment state:', {
      id: assignment.id,
      title: assignment.title,
      completed: assignment.completed,
      is_recurring: assignment.is_recurring,
      instance_completions: assignment.instance_completions,
      due_date: assignment.due_date,
    })

    // Determine current completion state
    let currentlyCompleted = false
    if (assignment.is_recurring && instanceDate) {
      currentlyCompleted =
        assignment.instance_completions?.[instanceDate]?.completed || false
    } else {
      currentlyCompleted = assignment.completed || false
    }

    // Toggle the state
    const newCompletedState = !currentlyCompleted

    const result = await AssignmentService.toggleAssignment(
      assignmentId,
      selectedChildId || undefined,
      instanceDate,
      newCompletedState,
    )

    console.log('TOGGLE RESULT:', result)

    if (result.success) {
      // Immediately update the assignment in the local state
      setAssignments(prevAssignments =>
        prevAssignments.map(a => {
          if (a.id === assignmentId) {
            return {
              ...a,
              completed: newCompletedState,
              completed_at: newCompletedState ? new Date().toISOString() : null
            }
          }
          return a
        })
      )

      // Also refresh from server with a small delay to ensure consistency
      setTimeout(async () => {
        await Promise.all([refreshAssignments(), refreshNotes()])
      }, 100)

      toast({
        title: 'Success',
        description: result.message,
      })
    } else {
      // Still refresh to ensure UI stays in sync
      await refreshAssignments()

      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      })
    }
  }

  const handleInstanceClick = (assignmentId: string, date: string) => {
    setSelectedInstanceDates((prev) => ({
      ...prev,
      [assignmentId]: date,
    }))

    if (expandedCardId !== assignmentId) {
      setExpandedCardId(assignmentId)
    }
  }

  const handleStartEdit = (note: Note) => {
    setEditingNote(note)
    setEditNoteData({ title: note.title, content: note.content || '' })
  }

  const handleCancelEdit = () => {
    setEditingNote(null)
    setEditNoteData({ title: '', content: '' })
  }

  const handleUpdateNote = async () => {
    if (!editingNote) return

    const result = await NoteService.updateNote(editingNote.id, editNoteData)

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Note updated successfully',
      })
      handleCancelEdit()
      refreshNotes()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update note',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    const result = await NoteService.deleteNote(noteId)

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Note deleted successfully',
      })
      refreshNotes()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete note',
        variant: 'destructive',
      })
    }
  }

  const dockItems = [
    {
      id: 'assignments',
      title: 'Assignments',
      icon: <BookA className="h-full w-full" />,
      content: (
        <AssignmentList
          assignments={assignments}
          selectedChildName={selectedChildName}
          onInstanceClick={handleInstanceClick}
          notes={notes}
          onNoteCreatedAction={refreshNotes}
          onToggleAction={_handleToggle}
          selectedChildId={selectedChildId}
        />
      ),
    },
    {
      id: 'timeline',
      title: 'Timeline',
      icon: <History className="h-full w-full" />,
      content: (
        <AssignmentTimeline
          assignments={assignments}
          onToggleAction={_handleToggle}
          selectedChildId={selectedChildId}
        />
      ),
    },
    {
      id: 'notes',
      title: 'Notes',
      icon: <NotebookText className="h-full w-full" />,
      content: (
        <NotesTab
          notes={notes}
          assignments={assignments}
          editingNote={editingNote}
          editNoteData={editNoteData}
          setEditNoteData={setEditNoteData}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
        />
      ),
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      icon: <ThumbsUp className="h-full w-full" />,
      content: (
        <ExpandingCardContainer
          assignments={[]}
          recommendations={recommendations}
          image={true}
          selectedChildId={selectedChildId}
          onToggleAction={_handleToggle}
        />
      ),
    },
  ]

  const handleContentChange = (itemId: string | null) => {
    if (itemId) {
      setActiveTab(itemId)
      setExpandedCardId(null)
    }
  }

  return (
    <React.Fragment>
      <div className="z-3 py-10 px-4 relative container mx-auto flex flex-col max-w-screen-xl">
        <StudentHeader
          userRole={userRole}
          selectedChildId={selectedChildId}
          selectedChildName={selectedChildName}
          childrenList={children}
          onChildSelect={handleChildSelect}
        />
        <Dock
          items={dockItems}
          className="z-50 isolate fixed bottom-5 left-1/2 max-w-full -translate-x-1/2"
          showContent={true}
          contentPosition="above"
          contentClassName="z-1 w-full mx-auto mb-8"
          onContentChange={handleContentChange}
        />

        <PageGrid variant="grid" />
      </div>
    </React.Fragment>
  )
}
