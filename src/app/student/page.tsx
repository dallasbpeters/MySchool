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

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<TabValue>('assignments')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [userRole, setUserRole] = useState<string>('')
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [selectedChildName, setSelectedChildName] = useState<string | null>(
    null,
  )
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedInstanceDates, setSelectedInstanceDates] = useState<
    Record<string, string>
  >({})
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editNoteData, setEditNoteData] = useState<{
    title: string
    content: string
  }>({ title: '', content: '' })
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true)

  const { toast } = useToast()

  // Handle tab changes and reset expanded card
  const handleTabChange = (newTab: TabValue) => {
    setActiveTab(newTab)
    setExpandedCardId(null) // Reset expanded card when switching tabs
  }

  const fetchAssignments = useCallback(async (childId?: string) => {
    try {
      setIsLoadingAssignments(true)
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
      setIsLoadingAssignments(false)
    }
  }, [])

  const fetchNotes = useCallback(async (childId?: string) => {
    try {
      const studentId = childId || selectedChildId
      const url = studentId ? `/api/notes?studentId=${studentId}` : '/api/notes'
      const response = await fetch(url)
      const data = await response.json()

      if (data.notes) {
        setNotes(data.notes)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }, [selectedChildId])

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
              fetchAssignments(firstStudent.id)
              fetchNotes(firstStudent.id)
            }
          } else {
            // No students found, set loading to false
            setIsLoadingAssignments(false)
          }
        } else {
          response = await fetch('/api/children')
          data = await response.json()
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
              fetchAssignments(firstChild.id)
              fetchNotes(firstChild.id)
            }
          } else {
            // No children found, set loading to false
            setIsLoadingAssignments(false)
          }
        }
      } catch (error) {
        console.error('Error fetching children:', error)
        setIsLoadingAssignments(false) // Set to false on error
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
          if (data.assignments) {
            setAssignments(data.assignments)
            setIsLoadingAssignments(false) // Only set to false when we have assignments
          } else {
            setIsLoadingAssignments(false) // Set to false if no assignments
          }
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
      setIsLoadingAssignments(false) // Set to false on error
    }
  }, [toast]) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize data
  useEffect(() => {
    checkUserRole()
    fetchNotes()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChildSelect = (childId: string, childName: string) => {
    setSelectedChildId(childId)
    setSelectedChildName(childName)
    setIsLoadingAssignments(true) // Reset loading state when switching children
    fetchAssignments(childId)
    fetchNotes(childId)
  }

  const handleToggle = async (assignmentId: string, instanceDate?: string) => {
    // Find the assignment to determine current completion state
    const assignment = assignments.find((a) => a.id === assignmentId)
    if (!assignment) return

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

    if (result.success) {
      fetchAssignments(selectedChildId || undefined)
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
      <div className="z-10 py-10 px-2 relative container mx-auto flex flex-col h-16 max-w-screen-2xl">
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
          <Suspense>
            <TabsContent value="assignments" className="relative">
              <AssignmentList
                assignments={assignments}
                selectedChildName={selectedChildName}
                expandedCardId={expandedCardId}
                setExpandedCardId={setExpandedCardId}
                selectedInstanceDates={selectedInstanceDates}
                notes={notes}
                onToggle={handleToggle}
                onNoteCreated={fetchNotes}
                onInstanceClick={handleInstanceClick}
                isLoading={isLoadingAssignments}
              />
            </TabsContent>
          </Suspense>

          <TabsContent value="timeline" className="relative">
            <AssignmentTimeline
              assignments={assignments}
              expandedCardId={expandedCardId}
              setExpandedCardId={setExpandedCardId}
              notes={notes}
              onToggle={handleToggle}
              onNoteCreated={fetchNotes}
            />
          </TabsContent>

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
        </Tabs>
        <LocalDock activeTab={activeTab} onTabChange={handleTabChange} />
      </div >

      <PageGrid variant="grid" />
    </>
  )
}
