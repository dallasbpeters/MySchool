'use client'

import React, { useState, useEffect, Suspense } from 'react'
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
  instance_completions?: Record<string, { completed: boolean; completed_at?: string; instance_date: string }>
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
  const [selectedChildName, setSelectedChildName] = useState<string | null>(null)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedInstanceDates, setSelectedInstanceDates] = useState<Record<string, string>>({})
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editNoteData, setEditNoteData] = useState<{ title: string; content: string }>({ title: '', content: '' })

  const { toast } = useToast()

  // Initialize data
  useEffect(() => {
    checkUserRole()
    fetchNotes()
  }, [])

  const checkUserRole = async () => {
    try {
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
        } else if (data.profile.role === 'admin') {
          setAssignments([])
          fetchChildren('admin')
        } else {
          if (data.assignments) {
            setAssignments(data.assignments)
          }
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      toast({
        title: "Assignment Loading Error",
        description: (error as Error).message || "Failed to load assignments. Please try refreshing the page.",
        variant: "destructive"
      })
    }
  }

  const fetchChildren = async (roleOverride?: string) => {
    try {
      const currentRole = roleOverride || userRole
      let response: Response
      let data: any

      if (currentRole === 'admin') {
        response = await fetch('/api/admin/students')
        data = await response.json()
        if (data.students && data.students.length > 0) {
          setChildren(data.students)
          if (!selectedChildId) {
            const firstStudent = data.students[0]
            setSelectedChildId(firstStudent.id)
            setSelectedChildName(firstStudent.name)
            fetchAssignments(firstStudent.id)
            fetchNotes(firstStudent.id)
          }
        }
      } else {
        response = await fetch('/api/children')
        data = await response.json()
        if (data.children && data.children.length > 0) {
          setChildren(data.children)
          if (!selectedChildId) {
            const firstChild = data.children[0]
            setSelectedChildId(firstChild.id)
            setSelectedChildName(firstChild.name)
            fetchAssignments(firstChild.id)
            fetchNotes(firstChild.id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error)
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
      console.error('Error fetching assignments:', error)
    }
  }

  const fetchNotes = async (childId?: string) => {
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
  }

  const handleChildSelect = (childId: string, childName: string) => {
    setSelectedChildId(childId)
    setSelectedChildName(childName)
    fetchAssignments(childId)
    fetchNotes(childId)
  }

  const handleToggle = async (assignmentId: string, instanceDate?: string) => {
    const result = await AssignmentService.toggleAssignment(assignmentId, selectedChildId || undefined, instanceDate)

    if (result.success) {
      fetchAssignments(selectedChildId || undefined)
      toast({
        title: "Success",
        description: result.message,
      })
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive"
      })
    }
  }

  const handleInstanceClick = (assignmentId: string, date: string, _dayName: string) => {
    setSelectedInstanceDates(prev => ({
      ...prev,
      [assignmentId]: date
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
        title: "Success",
        description: "Note updated successfully",
      })
      handleCancelEdit()
      fetchNotes()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update note",
        variant: "destructive"
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    const result = await NoteService.deleteNote(noteId)

    if (result.success) {
      toast({
        title: "Success",
        description: "Note deleted successfully",
      })
      fetchNotes()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete note",
        variant: "destructive"
      })
    }
  }


  return (
    <>
      <div className="z-10 relative container mx-auto p-4 max-w-6xl pb-24">
        <StudentHeader
          userRole={userRole}
          selectedChildId={selectedChildId}
          selectedChildName={selectedChildName}
          children={children}
          onChildSelect={handleChildSelect}
        />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full">
          <TabsContent value="assignments" className="relative">
            <Suspense fallback={<div className="flex items-center justify-center h-64">Loading assignments...</div>}>
              <AssignmentList
                assignments={assignments}
                userRole={userRole}
                selectedChildName={selectedChildName}
                expandedCardId={expandedCardId}
                setExpandedCardId={setExpandedCardId}
                selectedInstanceDates={selectedInstanceDates}
                notes={notes}
                onToggle={handleToggle}
                onNoteCreated={fetchNotes}
                onInstanceClick={handleInstanceClick}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="timeline" className="relative">
            <Suspense fallback={<div className="flex items-center justify-center h-64">Loading timeline...</div>}>
              <AssignmentTimeline
                assignments={assignments}
                expandedCardId={expandedCardId}
                setExpandedCardId={setExpandedCardId}
                notes={notes}
                onToggle={handleToggle}
                onNoteCreated={fetchNotes}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="notes" className="relative">
            <Suspense fallback={<div className="flex items-center justify-center h-64">Loading notes...</div>}>
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
        </Tabs>
      </div>

      <LocalDock activeTab={activeTab} onTabChange={setActiveTab} />
      <PageGrid variant="grid" />
    </>
  )
}
