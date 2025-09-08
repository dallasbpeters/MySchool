'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import {
  fetchAssignmentsCached,
  fetchChildrenCached,
  fetchRecommendationsCached,
} from '@/lib/cache-utils'
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
import { AnimatePresence } from 'motion/react'

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
    frequency?: 'weekly' | 'daily'
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

  // Debug: Watch for assignment changes
  useEffect(() => {
    console.log(
      '🔄 StudentDashboard: assignments state changed:',
      assignments.map((a) => ({
        id: a.id,
        title: a.title,
        completed: a.completed,
      })),
    )
  }, [assignments])

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
        const data = await fetchAssignmentsCached(childId)

        if (data.assignments) {
          console.log(
            '📦 Setting assignments after fetch:',
            data.assignments.map((a) => ({
              id: a.id,
              title: a.title,
              completed: a.completed,
            })),
          )
          console.log(
            '📋 BEFORE setting state, current assignments:',
            assignments.map((a) => ({
              id: a.id,
              title: a.title,
              completed: a.completed,
            })),
          )

          // Check if the target assignment was actually updated
          if (toggledAssignmentId) {
            const targetAssignment = data.assignments.find(
              (a) => a.id === toggledAssignmentId,
            )
            console.log(
              '🎯 Target assignment after update:',
              targetAssignment
                ? {
                  id: targetAssignment.id,
                  title: targetAssignment.title,
                  completed: targetAssignment.completed,
                }
                : 'NOT FOUND',
            )
          }

          console.log(
            '🔄 About to call setAssignments with updated assignments',
          )
          // Create a new array reference to force React re-render detection
          const newAssignments = [...data.assignments]
          setAssignments(newAssignments)
          console.log(
            '✅ setAssignments called with new array reference, state should update',
          )
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
    [initialLoadComplete, assignments],
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
            // Add default email if missing to match Child interface
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
            // No students found, complete initial load but keep assignments empty
            setIsLoadingAssignments(false)
            setInitialLoadComplete(true)
          }
        } else {
          data = await fetchChildrenCached()
          if (data.children && data.children.length > 0) {
            // Add default email if missing to match Child interface
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
            // No children found, complete initial load but keep assignments empty
            setIsLoadingAssignments(false)
            setInitialLoadComplete(true)
          }
        }
      } catch (error) {
        console.error('Error fetching children:', error)
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
          fetchChildren()
          // Don't set loading to false yet - wait for child selection
        } else if (data.profile.role === 'admin') {
          setAssignments([])
          fetchChildren('admin')
          // Don't set loading to false yet - wait for child selection
        } else {
          // For student role, we can load assignments directly
          if (data.assignments) {
            setAssignments(data.assignments)
          }
          setIsLoadingAssignments(false)
          setInitialLoadComplete(true)
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error)
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

  // Initialize data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load data in parallel for better performance
        const [_notesData, recommendationsData] = await Promise.all([
          fetchNotes(),
          fetchRecommendationsCached(),
        ])

        // Process recommendations data
        if (recommendationsData.recommendations) {
          setRecommendations(recommendationsData.recommendations)
        }

        // Check user role and load children if needed
        await checkUserRole()
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }

    loadInitialData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChildSelect = (childId: string, childName: string) => {
    setSelectedChildId(childId)
    setSelectedChildName(childName)
    setIsLoadingAssignments(true)
    fetchAssignments(childId)
    fetchNotes(childId)
  }

  const _handleToggle = async (assignmentId: string, instanceDate?: string) => {
    console.log(
      '🔄 _handleToggle called:',
      assignmentId,
      'with instanceDate:',
      instanceDate,
    )
    console.log(
      '📋 Current assignments before toggle:',
      assignments.map((a) => ({
        id: a.id,
        title: a.title,
        completed: a.completed,
      })),
    )

    // Find the assignment to determine current completion state
    const assignment = assignments.find((a) => a.id === assignmentId)
    if (!assignment) {
      console.log('❌ Assignment not found:', assignmentId)
      return
    }

    console.log('📝 Found assignment:', {
      id: assignment.id,
      title: assignment.title,
      completed: assignment.completed,
      is_recurring: assignment.is_recurring,
    })

    // Determine current completion state
    let currentlyCompleted = false
    if (assignment.is_recurring && instanceDate) {
      currentlyCompleted =
        assignment.instance_completions?.[instanceDate]?.completed || false
      console.log('🔄 Recurring assignment current state:', currentlyCompleted)
    } else {
      currentlyCompleted = assignment.completed || false
      console.log('🔄 Regular assignment current state:', currentlyCompleted)
    }

    // Toggle the state
    const newCompletedState = !currentlyCompleted
    console.log(
      '🎯 Will toggle from',
      currentlyCompleted,
      'to',
      newCompletedState,
    )

    const result = await AssignmentService.toggleAssignment(
      assignmentId,
      selectedChildId || undefined,
      instanceDate,
      newCompletedState,
    )

    console.log('📡 API result:', result)

    if (result.success) {
      console.log('✅ API success, about to fetch assignments...')
      // Use await to ensure we wait for the fetch to complete
      await fetchAssignments(selectedChildId || undefined, false, assignmentId)
      console.log('✅ Assignments fetched after toggle')
      toast({
        title: 'Success',
        description: result.message,
      })
    } else {
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
          <AnimatePresence mode="wait">
            <Suspense>
              <TabsContent value="assignments" className="relative">
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
              </TabsContent>
            </Suspense>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <Suspense>
              <TabsContent value="timeline" className="relative">
                <AssignmentTimeline
                  assignments={assignments}
                  onToggle={_handleToggle}
                  selectedChildId={selectedChildId}
                />
              </TabsContent>
            </Suspense>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <Suspense>
              <TabsContent value="notes" className="relative">
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
              </TabsContent>
            </Suspense>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <Suspense>
              <TabsContent value="recommendations" className="relative">
                <ExpandingCardContainer
                  assignments={[]}
                  recommendations={_recommendations}
                  image={true}
                  selectedChildId={selectedChildId}
                />
              </TabsContent>
            </Suspense>
          </AnimatePresence>
        </Tabs>
        <LocalDock activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      <PageGrid variant="grid" />
    </>
  )
}
