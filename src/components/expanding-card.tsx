'use client'

import React, { useState } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle2, BookOpen, Plus, Check } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { AnimatePresence } from 'motion/react'
import { Toggle } from '@/components/ui/toggle'
import { MultiStateBadge } from '@/components/multi-state-badge'
import { AssignmentService } from '@/services/assignment-service'
import { Assignment } from '@/types'
import { images } from '@/components/images'
import Layout from '@/app/calendar/layout'

// Union type to handle both assignments and recommendations
type AssignmentOrRecommendation =
  | (ExtendedAssignment & { type: 'assignment' })
  | (Recommendation & { type: 'recommendation' })

// Extend Assignment with additional properties for the ExpandingCard component
interface ExtendedAssignment extends Assignment {
  type?: 'assignment'
  image?: string
  logo?: string
  alt?: string
  description?: string
}

interface Note {
  id: string
  title: string
  content: string | null
  category: string
  created_at: string
  assignment_id?: string
}

interface AssignmentCardProps {
  image: boolean
  showDate: boolean
  assignment: AssignmentOrRecommendation
  size: 'small' | 'xs'
  onToggleAction: (id: string, instanceDate?: string) => void
  getDateLabel: (date: string, completed?: boolean) => string
  getDateColor: (date: string, completed?: boolean) => string
  imageIndex?: number
  expandedCardId: string | null
  setExpandedCardId: (id: string | null) => void
  onNoteCreatedAction?: () => void
  assignmentNotes?: Note[]
  selectedInstanceDate?: string
  selectedChildId?: string | null
}

// Separate component for rendering note content to avoid hook rule violations
function NoteContent({ content }: { content: string | null }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none',
      },
    },
  })

  return <EditorContent editor={editor} />
}

// Global image index counter to ensure images cycle once across all instances
let globalImageIndex = 0

// Global map to store assignment image indices persistently
const globalAssignmentImageMap = new Map<string, number>()

function AssignmentCard({
  assignment,
  size,
  onToggleAction: _onToggleAction,
  getDateLabel,
  getDateColor,
  imageIndex = 0,
  image: _image,
  showDate,
  onNoteCreatedAction: _onNoteCreatedAction,
  assignmentNotes: _assignmentNotes = [],
  selectedInstanceDate,
  expandedCardId: _expandedCardId,
  setExpandedCardId: _setExpandedCardId,
  groupId,
  onClick,
}: AssignmentCardProps & { groupId?: string; onClick?: () => void }) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      exit={{
        opacity: 0,
        scale: 0.8,
        y: -20,
        transition: { duration: 0.3, ease: 'easeInOut' },
      }}
      className={`card card__${size} cursor-pointer ${assignment.type === 'assignment' && assignment.completed ? 'completed' : ''}`}
      onClick={onClick}
      layoutId={`assignment-card-container-${assignment.id}-${groupId || 'default'}`}
    >
      <motion.div
        className="card-image-container"
        layoutId={`assignment-image-container-${assignment.id}-${groupId || 'default'}`}
      >
        <motion.div
          className="card-image"
          style={{
            backgroundImage: `url(${images[imageIndex % images.length]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
          layoutId={`assignment-image-${assignment.id}-${groupId || 'default'}`}
        />
      </motion.div>
      <motion.div
        className="title-container"
        layoutId={`title-container-${assignment.id}-${groupId || 'default'}`}
        layout="position"
      >
        {assignment.category && (
          <span className="category">{assignment.category}</span>
        )}
        <h2>{assignment.title}</h2>
      </motion.div>
      {showDate && (
        <div
          className={`bg-background/70 px-3 py-2 absolute bottom-0 left-0 right-0 flex items-baseline gap-1 mt-2 ${getDateColor(selectedInstanceDate || (assignment.type === 'assignment' ? assignment.due_date || '' : assignment.created_at), assignment.type === 'assignment' ? assignment.completed : false)}`}
        >
          <Calendar className="h-3 w-3" />
          <span className="text-sm">
            {selectedInstanceDate
              ? format(parseISO(selectedInstanceDate), 'MMM dd, yyyy')
              : getDateLabel(
                assignment.type === 'assignment'
                  ? assignment.due_date || ''
                  : assignment.created_at,
                assignment.type === 'assignment'
                  ? assignment.completed
                  : false,
              )}
          </span>
          {assignment.type === 'assignment' && assignment.completed && (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-500 ml-2" />
              <span className="text-green-500 text-sm">Completed</span>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

function AssignmentCardExpanded({
  id: _id,
  assignment,
  onToggleAction: _onToggleAction,
  getDateLabel: _getDateLabel,
  getDateColor: _getDateColor,
  imageIndex,
  image: _image,
  showDate: _showDate,
  onNoteCreatedAction: _onNoteCreatedAction,
  assignmentNotes: _assignmentNotes = [],
  selectedInstanceDate,
  selectedChildId,
  groupId,
  onClose,
}: {
  id: string
  assignment: AssignmentOrRecommendation
  onToggleAction: (id: string, instanceDate?: string) => void
  getDateLabel: (date: string, completed?: boolean) => string
  getDateColor: (date: string, completed?: boolean) => string
  imageIndex: number
  image: boolean
  showDate: boolean
  onNoteCreatedAction?: () => void
  assignmentNotes?: Note[]
  selectedInstanceDate?: string
  selectedChildId?: string | null
  groupId?: string
  onClose?: () => void
}) {
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [localAssignment, setLocalAssignment] = useState(assignment)
  const [newNote, setNewNote] = useState<{
    title: string
    content: string | null
  }>({ title: '', content: null })
  const { toast } = useToast()

  // Filter notes that belong directly to this assignment
  const relatedNotes = _assignmentNotes.filter((note) => {
    // First check for direct assignment association
    if (note.assignment_id) {
      const matches = note.assignment_id === assignment.id
      return matches
    }

    // Fallback to category matching for legacy notes
    const assignmentCategory = assignment.category?.trim() || 'General'
    const noteCategory = note.category?.trim() || 'General'
    const matches = noteCategory === assignmentCategory
    return matches
  })

  const editor = useEditor({
    extensions: [StarterKit],
    content: assignment.content,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-md max-w-none',
      },
    },
  })

  const createNote = async () => {
    try {
      if (!newNote.title.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a title for the note',
          variant: 'destructive',
        })
        return
      }

      const category = assignment.category?.trim() || 'General'

      const requestBody: {
        title: string
        content: string
        category: string
        assignment_id: string
        studentId?: string
      } = {
        title: newNote.title.trim(),
        content: newNote.content,
        category,
        assignment_id: assignment.id,
      }

      // If we have a selected child ID, pass it to create the note for that child
      if (selectedChildId) {
        requestBody.studentId = selectedChildId
      }

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message || 'Note created successfully',
        })
        setNewNote({ title: '', content: null })
        setIsCreatingNote(false)
        if (_onNoteCreatedAction) {
          _onNoteCreatedAction()
        }
      } else {
        console.error('Note creation failed:', data)
        toast({
          title: 'Error',
          description: data.error || 'Failed to create note',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create note',
      })
    }
  }

  const handleToggleAssignment = async () => {
    if (isToggling || assignment.type !== 'assignment') return

    setIsToggling(true)

    try {
      let instanceDate: string | undefined = undefined
      if (assignment.is_recurring) {
        instanceDate = selectedInstanceDate
        if (!instanceDate) {
          instanceDate = format(new Date(), 'yyyy-MM-dd')
        }
      }

      // Determine the new completion state based on current local state
      const currentCompleted = assignment.type === 'assignment' ? (localAssignment as ExtendedAssignment).completed : false
      const newCompletedState = assignment.type === 'assignment' ? !currentCompleted : false

      const requestPayload = {
        completed: newCompletedState,
        instanceDate,
        ...(selectedChildId && { studentId: selectedChildId })
      }

      const response = await fetch(`/api/assignments/${assignment.id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state immediately for better UX
        if (assignment.type === 'assignment') {
          setLocalAssignment(prev => ({
            ...prev,
            completed: newCompletedState
          }))
        }

        toast({
          title: 'Success',
          description: data.message || `Assignment ${newCompletedState ? 'completed' : 'reopened'} successfully`,
        })

        // Call the parent's toggle action to update the list
        _onToggleAction(assignment.id, instanceDate)

        // Close the modal after successful toggle
        setTimeout(() => {
          if (onClose) {
            onClose()
          }
        }, 50)
      } else {
        console.error('Assignment toggle failed:', data)
        toast({
          title: 'Error',
          description: data.error || 'Failed to update assignment status',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Assignment toggle error:', error)
      toast({
        title: 'Error',
        description: 'Failed to update assignment status',
        variant: 'destructive',
      })
    } finally {
      // Add a small delay to show the processing state
      setTimeout(() => {
        setIsToggling(false)
      }, 500)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ pointerEvents: 'auto' }}
        className="card-overlay"
      />
      <div className="card-content-container open">
        <motion.div
          className="card-content"
          layoutId={`assignment-card-container-${assignment.id}-${groupId || 'default'}`}
        >
          <motion.button
            className="close-button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose?.()
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>

          <motion.div
            className="card-image-container"
            layoutId={`assignment-image-container-${assignment.id}-${groupId || 'default'}`}
          >
            <motion.div
              className="card-image expanded"
              style={{
                backgroundImage: `url(${images[imageIndex % images.length]})`,
                backgroundSize: '105%',
                backgroundPosition: 'center',
              }}
              layoutId={`assignment-image-${assignment.id}-${groupId || 'default'}`}
            />
          </motion.div>
          <motion.div
            className="title-container"
            layoutId={`assignment-title-container-${assignment.id}-${groupId || 'default'}`}
            layout="position"
          >
            {assignment.category && (
              <span className="category">{assignment.category}</span>
            )}
            <h2>{assignment.title}</h2>
          </motion.div>
          <AnimatePresence>
            {!isCreatingNote && (
              <motion.div initial={false} className="content-container small">
                {assignment.content && (
                  <div className="prose prose-sm max-w-none">
                    <EditorContent editor={editor} />
                  </div>
                )}
                {assignment.links && assignment.links.length > 0 && (
                  <div className="mt-4">
                    <ul className="space-y-1 flex gap-2">
                      {assignment.links.map((link, index) => (
                        <li key={index}>
                          <Button
                            onClick={() => window.open(link.url, '_blank')}
                          >
                            {link.title}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Display related notes - only for assignments */}
                {assignment.type === 'assignment' &&
                  !isCreatingNote &&
                  relatedNotes.length > 0 && (
                    <div className="my-4 pt-4 border-t border-border">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Notes ({relatedNotes.length})
                      </h4>
                      <div className="space-y-2">
                        <AnimatePresence mode="sync">
                          {relatedNotes.map((note) => (
                            <motion.div
                              layout
                              key={note.id}
                              className="border border-border rounded-md p-4"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="text-sm font-medium text-foreground-muted">
                                  {note.title}
                                </h5>
                                <span className="text-sm font-medium text-gray-500">
                                  {format(new Date(note.created_at), 'MMM dd')}
                                </span>
                              </div>
                              {note.content && (
                                <div className="text-sm text-foreground-muted">
                                  <NoteContent content={note.content} />
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer - only show for assignments */}
          {assignment.type === 'assignment' && (
            <motion.div className="flex flex-col gap-4 p-6 border-t border-border">
              <div className="flex gap-4">
                <AnimatePresence>
                  {!isCreatingNote && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setIsCreatingNote(true)}
                      className="cursor-pointer gap-2 flex justify-self-start items-center justify-center w-full border border-border rounded-md h-12"
                    >
                      <Plus className="h-4 w-4" />
                      Add Note
                    </motion.button>
                  )}
                </AnimatePresence>

                {!isCreatingNote && (
                  <MultiStateBadge
                    isCompleted={localAssignment.type === 'assignment' ? (localAssignment as ExtendedAssignment).completed || false : false}
                    isRecurring={assignment.is_recurring || false}
                    isToggling={isToggling}
                    onToggle={handleToggleAssignment}
                  />
                )}
              </div>

              {isCreatingNote && (
                <motion.div
                  className="w-full justify-end space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <Label htmlFor={`note-title-${assignment.id}`}>
                      Note Title
                    </Label>
                    <Input
                      id={`note-title-${assignment.id}`}
                      placeholder="Enter note title..."
                      value={newNote.title}
                      onChange={(e) =>
                        setNewNote({ ...newNote, title: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`note-content-${assignment.id}`}>
                      Content
                    </Label>
                    <div className="mt-1">
                      <WysiwygEditor
                        content={newNote.content}
                        onChange={(content) =>
                          setNewNote({ ...newNote, content })
                        }
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
                    <Button onClick={createNote}>Save Note</Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  )
}

export function AssignmentCardList({
  assignments,
  image,
  onCardClickAction,
  groupId,
  size = 'small',
  assignmentNotes = [],
  onNoteCreatedAction,
  onToggleAction,
  recommendations,
}: {
  assignments: Assignment[]
  image: boolean
  onCardClickAction: (assignmentId: string) => void
  groupId?: string
  size?: 'small' | 'xs'
  assignmentNotes?: Note[]
  onNoteCreatedAction?: () => void
  onToggleAction?: (id: string, instanceDate?: string) => void
  recommendations?: Recommendation[]
}) {
  // Combine assignments and recommendations into a single list
  const allItems = [
    ...assignments.map((item) => ({ ...item, type: 'assignment' as const })),
    ...(recommendations || []).map((item) => ({
      ...item,
      type: 'recommendation' as const,
    })),
  ]

  return (
    <div
      id={`expanding-card-${groupId || 'default'}`}
      className="expanding-card-list"
    >
      <AnimatePresence mode="popLayout">
        {allItems.map((item) => {
          const isAssignment = item.type === 'assignment'
          // Get or create the image index for this item
          let currentImageIndex: number

          if (globalAssignmentImageMap.has(item.id)) {
            // Use existing image index if already assigned
            currentImageIndex = globalAssignmentImageMap.get(item.id)!
          } else {
            // Assign new image index and increment global counter
            currentImageIndex = globalImageIndex % images.length
            globalImageIndex++

            // Store the imageIndex for this item
            globalAssignmentImageMap.set(item.id, currentImageIndex)
          }

          return (
            <AssignmentCard
              size={size}
              key={item.id}
              assignment={item}
              onToggleAction={onToggleAction || (() => { })}
              getDateLabel={(date, _completed) =>
                isAssignment
                  ? AssignmentService.getDateLabel(item as Assignment)
                  : format(parseISO(date), 'MMM dd, yyyy')
              }
              getDateColor={(_date, _completed) =>
                isAssignment
                  ? AssignmentService.getDateColor(item as Assignment)
                  : 'text-gray-600'
              }
              imageIndex={currentImageIndex}
              image={image}
              showDate={isAssignment}
              onNoteCreatedAction={onNoteCreatedAction}
              assignmentNotes={assignmentNotes}
              expandedCardId={null}
              setExpandedCardId={() => { }}
              selectedInstanceDate={undefined}
              groupId={groupId}
              onClick={() => onCardClickAction(item.id)}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function AssignmentCardGroup({
  assignments,
  image,
  groupId,
  size = 'small',
  assignmentNotes = [],
  onNoteCreatedAction,
  onToggleAction,
  recommendations,
  selectedChildId,
}: {
  assignments: Assignment[]
  image: boolean
  groupId?: string
  size?: 'small' | 'xs'
  assignmentNotes?: Note[]
  onNoteCreatedAction?: () => void
  onToggleAction?: (id: string, instanceDate?: string) => void
  recommendations?: Recommendation[]
  selectedChildId?: string | null
}) {
  // Track group re-renders

  const [openId, setOpenId] = useState<string | null>(null)
  const openCard = (id: string) => setOpenId(id)
  const closeCard = () => setOpenId(null)

  // Combine assignments and recommendations into a single list for the expanded card
  const allItems = [
    ...assignments.map((item) => ({ ...item, type: 'assignment' as const })),
    ...(recommendations || []).map((item) => ({
      ...item,
      type: 'recommendation' as const,
    })),
  ]

  return (
    <>
      <AssignmentCardList
        assignments={assignments}
        image={image}
        onCardClickAction={openCard}
        groupId={groupId}
        size={size}
        assignmentNotes={assignmentNotes}
        onNoteCreatedAction={onNoteCreatedAction}
        onToggleAction={onToggleAction}
        recommendations={recommendations}
      />
      <AnimatePresence>
        {openId && (
          <AssignmentCardExpanded
            id={openId}
            key="card-item"
            assignment={
              allItems.find((item) => item.id === openId) || {
                ...assignments.find((a) => a.id === openId)!,
                type: 'assignment' as const,
              }
            }
            onToggleAction={onToggleAction || (() => { })}
            getDateLabel={(_date, _completed) => {
              const foundItem = allItems.find((item) => item.id === openId)
              const isItemAssignment = foundItem?.type === 'assignment'
              return isItemAssignment
                ? AssignmentService.getDateLabel(foundItem as Assignment)
                : format(parseISO(_date), 'MMM dd, yyyy')
            }}
            getDateColor={(_date, _completed) => {
              const foundItem = allItems.find((item) => item.id === openId)
              const isItemAssignment = foundItem?.type === 'assignment'
              return isItemAssignment
                ? AssignmentService.getDateColor(foundItem as Assignment)
                : 'text-gray-600'
            }}
            imageIndex={globalAssignmentImageMap.get(openId) || 0}
            image={image}
            showDate={
              allItems.find((item) => item.id === openId)?.type === 'assignment'
            }
            onNoteCreatedAction={onNoteCreatedAction}
            assignmentNotes={assignmentNotes}
            selectedChildId={selectedChildId}
            groupId={groupId}
            onClose={closeCard}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export { AssignmentCard }

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

export default function AssignmentCardContainer({
  assignments,
  image,
  groupId,
  size = 'small',
  assignmentNotes = [],
  onNoteCreatedAction,
  onToggleAction,
  recommendations,
  selectedChildId,
}: {
  assignments: Assignment[]
  image: boolean
  groupId?: string
  size?: 'small' | 'xs'
  assignmentNotes?: Note[]
  onNoteCreatedAction?: () => void
  onToggleAction?: (id: string, instanceDate?: string) => void
  recommendations?: Recommendation[]
  selectedChildId?: string | null
}) {
  // Track container re-renders

  return (
    <div id="expanding-card">
      <LayoutGroup>
        <AssignmentCardGroup
          assignments={assignments}
          image={image}
          groupId={groupId}
          size={size}
          assignmentNotes={assignmentNotes}
          onNoteCreatedAction={onNoteCreatedAction}
          onToggleAction={onToggleAction}
          recommendations={recommendations}
          selectedChildId={selectedChildId}
        />
      </LayoutGroup>
    </div>
  )
}
