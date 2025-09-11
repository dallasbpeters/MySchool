'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { LocalDock, type TabValue } from '@/components/local-dock'
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
  const [activeTab, setActiveTab] = useState<TabValue>('assignments')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [_recommendations, setRecommendations] = useState<Recommendation[]>([])
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
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)


  const { toast } = useToast()

  // Handle tab changes and reset expanded card
  const handleTabChange = (newTab: TabValue) => {
    setActiveTab(newTab)
    setExpandedCardId(null) // Reset expanded card when switching tabs
  }

  const fetchAssignments = useCallback(
    async (
      childId?: string,
      isInitialLoad = false,
      toggledAssignmentId?: string,
    ) => {
      try {
        // Always set loading to true when explicitly requested or during initial load
        if (isInitialLoad || !initialLoadComplete) {
          setIsLoadingAssignments(true)
        }
        const url = childId
          ? `/api/assignments?childId=${childId}`
          : '/api/assignments'
        const response = await fetch(url)
        const data = await response.json()

        if (data.assignments) {
          setAssignments(data.assignments)
          if (data.profile?.role) {
            setUserRole(data.profile.role)
          }
        }
      } catch (error) {
        console.error('Error fetching assignments:', error)
      } finally {
        // Always reset loading state, but only mark initial load complete when appropriate
        setIsLoadingAssignments(false)
        if (isInitialLoad || !initialLoadComplete) {
          setInitialLoadComplete(true)
        }
      }
    },
    [initialLoadComplete],
  )

  const fetchNotes = useCallback(
    async (childId?: string) => {
      try {
        const studentId = childId || selectedChildId
        const url = studentId
          ? `/api/notes?studentId=${studentId}`
          : '/api/notes'
        const response = await fetch(url)
        const data = await response.json()

        if (data.notes) {
          setNotes(data.notes)
        }
      } catch (error) {
        console.error('Error fetching notes:', error)
      }
    },
    [selectedChildId],
  )

  const _fetchRecommendations = useCallback(async () => {
    try {
      const response = await fetch('/api/recommendations')
      const data = await response.json()

      if (data.recommendations) {
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    }
  }, [])

  const fetchChildren = useCallback(
    async (roleOverride?: string) => {
      try {
        const currentRole = roleOverride || userRole

        let response: Response
        let data: {
          students?: Array<{
            id: string
            name: string
            email?: string
            parent_name?: string
          }>
          children?: Array<{ id: string; name: string; email?: string }>
        }

        if (currentRole === 'admin') {
          response = await fetch('/api/admin/students')
          data = await response.json()

          if (data.students && data.students.length > 0) {
            const studentsWithEmail = data.students.map((student) => ({
              ...student,
              email:
                student.email ||
                `${student.name.toLowerCase().replace(/\s+/g, '.')}@student.local`,
            }))
            setChildren(studentsWithEmail)
            if (!selectedChildId) {
              const firstStudent = data.students[0]
              setSelectedChildId(firstStudent.id)
              setSelectedChildName(firstStudent.name)
              fetchAssignments(firstStudent.id, true)
              fetchNotes(firstStudent.id)
            }
          } else {
            setIsLoadingAssignments(false)
            setInitialLoadComplete(true)
          }
        } else {
          response = await fetch('/api/children')
          data = await response.json()

          if (data.children && data.children.length > 0) {
            const childrenWithEmail = data.children.map((child) => ({
              ...child,
              email:
                child.email ||
                `${child.name.toLowerCase().replace(/\s+/g, '.')}@student.local`,
            }))
            setChildren(childrenWithEmail)
            if (!selectedChildId) {
              const firstChild = data.children[0]
              setSelectedChildId(firstChild.id)
              setSelectedChildName(firstChild.name)
              fetchAssignments(firstChild.id, true)
              fetchNotes(firstChild.id)
            }
          } else {
            setIsLoadingAssignments(false)
            setInitialLoadComplete(true)
          }
        }
      } catch (error) {
        setIsLoadingAssignments(false)
        setInitialLoadComplete(true)
      }
    },
    [userRole, fetchAssignments, fetchNotes, selectedChildId],
  )

  const checkUserRole = useCallback(async () => {
    try {
      setIsLoadingAssignments(true)

      const response = await fetch('/api/assignments')

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch assignments')
      }

      if (data.profile?.role) {
        setUserRole(data.profile.role)

        if (data.profile.role === 'parent') {
          setAssignments([])
          await fetchChildren()
        } else if (data.profile.role === 'admin') {
          setAssignments([])
          await fetchChildren('admin')
        } else {
          if (data.assignments) {
            setAssignments(data.assignments)
          }
          setIsLoadingAssignments(false)
          setInitialLoadComplete(true)
        }
      } else {
        setIsLoadingAssignments(false)
        setInitialLoadComplete(true)
      }
    } catch (error) {
      toast({
        title: 'Assignment Loading Error',
        description:
          (error as Error).message ||
          'Failed to load assignments. Please try refreshing the page.',
        variant: 'destructive',
      })
      setIsLoadingAssignments(false)
      setInitialLoadComplete(true)
    }
  }, [toast]) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize data - simplified for debugging
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // First, test authentication
        const authResponse = await fetch('/api/auth-test')
        const authData = await authResponse.json()

        if (!authData.success) {
          setIsLoadingAssignments(false)
          setInitialLoadComplete(true)
          return
        }

        // Simple user role check
        await checkUserRole()
      } catch (error) {
        setIsLoadingAssignments(false)
        setInitialLoadComplete(true)
      }
    }

    loadInitialData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChildSelect = (childId: string, childName: string) => {
    setSelectedChildId(childId)
    setSelectedChildName(childName)
    setIsLoadingAssignments(true)
    fetchAssignments(childId, true) // Pass true to force loading state and fresh fetch
    fetchNotes(childId)
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
      due_date: assignment.due_date
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

    console.log('TOGGLE OPERATION:', {
      assignmentId,
      instanceDate,
      currentlyCompleted,
      newCompletedState,
      selectedChildId: selectedChildId || 'none'
    })

    const result = await AssignmentService.toggleAssignment(
      assignmentId,
      selectedChildId || undefined,
      instanceDate,
      newCompletedState,
    )

    console.log('TOGGLE RESULT:', result)

    if (result.success) {
      // Use await to ensure we wait for the fetch to complete
      await fetchAssignments(selectedChildId || undefined, false)
      await fetchNotes(selectedChildId || undefined)

      // Log assignment state after refetch
      const updatedAssignment = assignments.find((a) => a.id === assignmentId)
      console.log('AFTER REFETCH - Assignment state:', {
        id: updatedAssignment?.id,
        title: updatedAssignment?.title,
        completed: updatedAssignment?.completed,
        is_recurring: updatedAssignment?.is_recurring,
        instance_completions: updatedAssignment?.instance_completions,
        due_date: updatedAssignment?.due_date
      })

      toast({
        title: 'Success',
        description: result.message,
      })
    } else {
      // Still refetch to ensure UI stays in sync even if there was an error
      await fetchAssignments(selectedChildId || undefined, false)

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
      fetchNotes()
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
      fetchNotes()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete note',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <div className="z-3 py-10 px-4 relative container mx-auto flex flex-col max-w-screen-xl">
        <StudentHeader
          userRole={userRole}
          selectedChildId={selectedChildId}
          selectedChildName={selectedChildName}
          childrenList={children}
          onChildSelect={handleChildSelect}
        />

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
          className="w-full"
        >
          <TabsContent value="assignments" className="relative">
            <Suspense>
              <AssignmentList
                assignments={assignments}
                selectedChildName={selectedChildName}
                onInstanceClick={handleInstanceClick}
                isLoading={isLoadingAssignments || !initialLoadComplete}
                notes={notes}
                onNoteCreated={fetchNotes}
                onToggle={_handleToggle}
                selectedChildId={selectedChildId}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="timeline" className="relative">
            <AssignmentTimeline
              assignments={assignments}
              onToggle={_handleToggle}
              selectedChildId={selectedChildId}
            />
          </TabsContent>

          <TabsContent value="notes" className="relative">
            <Suspense>
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
            </Suspense>
          </TabsContent>

          <TabsContent value="recommendations" className="relative">
            <Suspense>
              <ExpandingCardContainer
                assignments={[]}
                recommendations={_recommendations}
                image={true}
                selectedChildId={selectedChildId}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
        <LocalDock activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      <PageGrid variant="grid" />
    </>
  )
}
