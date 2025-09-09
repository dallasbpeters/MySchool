'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  CheckCircle2,
  BookOpen,
  Plus,
  Repeat,
  Check,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { AnimatePresence } from 'motion/react'
import { Toggle } from '@/components/ui/toggle'
import { AssignmentService } from '@/services/assignment-service'
import { Assignment } from '@/types'
import './ui/shared-card-styles.css'

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
  onToggle: (id: string, instanceDate?: string) => void
  getDateLabel: (date: string, completed?: boolean) => string
  getDateColor: (date: string, completed?: boolean) => string
  imageIndex?: number
  expandedCardId: string | null
  setExpandedCardId: (id: string | null) => void
  onNoteCreated?: () => void
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

export const images = [
  '/gemma-evans-swmWhdbcb6M-unsplash.svg',
  '/wildan-kurniawan-fKdoeUJBh_o-unsplash.svg',
  '/getty-images-F1sG0MZT_Ro-unsplash.svg',
  '/melanie-villette-Somqo53jwzE-unsplash.svg',
  '/eva-corbisier-6QxDZxUaScw-unsplash.svg',
  '/risky-ming-fFa5xAoT8ms-unsplash.svg',
  '/gemma-evans-qVzRlSDe8OU-unsplash.svg',
  '/risky-ming--AsW_zqKQ9E-unsplash.svg',
  '/getty-images-pnkJbt9HVBA-unsplash.svg',
  '/lorenzo-mercanti-aKdXUkOY5ek-unsplash.svg',
  '/amanda-sala-oHHc3UsNrqs-unsplash.svg',
  '/melanie-villette-lQDNr81EW0w-unsplash.svg',
  '/evelina-mitev-jV_8Fn1l1ec-unsplash.svg',
  '/melanie-villette-wI97g9u9XVM-unsplash.svg',
]

// Global image index counter to ensure images cycle once across all instances
let globalImageIndex = 0

// Global map to store assignment image indices persistently
const globalAssignmentImageMap = new Map<string, number>()

function AssignmentCard({
  assignment,
  size,
  onToggle: _onToggle,
  getDateLabel,
  getDateColor,
  imageIndex = 0,
  image: _image,
  showDate,
  onNoteCreated: _onNoteCreated,
  assignmentNotes: _assignmentNotes = [],
  selectedInstanceDate,
  expandedCardId: _expandedCardId,
  setExpandedCardId: _setExpandedCardId,
  groupId,
  onClick,
}: AssignmentCardProps & { groupId?: string; onClick?: () => void }) {
  return (
    <motion.div
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
        {assignment.category && (
          <motion.div
            className="category"
            layoutId={`category-${assignment.id}-${groupId || 'default'}`}
          >
            {assignment.category}
          </motion.div>
        )}
        <motion.img
          className="card-image"
          src={images[imageIndex % images.length]}
          alt=""
          layoutId={`assignment-image-${assignment.id}-${groupId || 'default'}`}
          style={{
            backgroundImage: `url(${images[imageIndex % images.length]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
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
        <h2 className="font-bold text-xl h2">{assignment.title}</h2>
      </motion.div>
      {showDate && (
        <div
          className={`bg-background/70 p-2 absolute bottom-0 left-0 right-0 flex items-center gap-2 mt-2 ${getDateColor(selectedInstanceDate || (assignment.type === 'assignment' ? assignment.due_date || '' : assignment.created_at), assignment.type === 'assignment' ? assignment.completed : false)}`}
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
  onToggle: _onToggle,
  getDateLabel: _getDateLabel,
  getDateColor: _getDateColor,
  imageIndex,
  image: _image,
  showDate: _showDate,
  onNoteCreated: _onNoteCreated,
  assignmentNotes: _assignmentNotes = [],
  selectedInstanceDate,
  selectedChildId,
  groupId,
  onClose,
}: {
  id: string
  assignment: AssignmentOrRecommendation
  onToggle: (id: string, instanceDate?: string) => void
  getDateLabel: (date: string, completed?: boolean) => string
  getDateColor: (date: string, completed?: boolean) => string
  imageIndex: number
  image: boolean
  showDate: boolean
  onNoteCreated?: () => void
  assignmentNotes?: Note[]
  selectedInstanceDate?: string
  selectedChildId?: string | null
  groupId?: string
  onClose?: () => void
}) {
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
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
        class: 'prose prose-sm max-w-none',
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
        if (_onNoteCreated) {
          _onNoteCreated()
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
            {assignment.category && (
              <motion.div
                className="category"
                layoutId={`category-${assignment.id}-${groupId || 'default'}`}
              >
                {assignment.category}
              </motion.div>
            )}
            <motion.img
              className="card-image expanded"
              src={images[imageIndex % images.length]}
              alt=""
              layoutId={`assignment-image-${assignment.id}-${groupId || 'default'}`}
              style={{
                objectFit: 'cover',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
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
            <h2 className="font-bold text-xl h2">{assignment.title}</h2>
            {assignment.type === 'assignment' && assignment.is_recurring && (
              <Repeat className="inline-block align-baseline h-4 w-4 ms-1 text-sm text-muted-foreground" />
            )}
          </motion.div>
          <AnimatePresence>
            {!isCreatingNote && (
              <motion.div initial={false} className="content-container small">
                {assignment.content && (
                  <div className="prose prose-sm max-w-none">
                    <p className="big">{assignment.title}</p>
                    <EditorContent editor={editor} />
                  </div>
                )}
                {assignment.links && assignment.links.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Resources:</h4>
                    <ul className="space-y-1">
                      {assignment.links.map((link, index) => (
                        <li key={index}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-secondary underline"
                          >
                            {link.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Display related notes */}
                {!isCreatingNote && relatedNotes.length > 0 && (
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

          {/* Footer with Add Note and Completion Toggle */}
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
                <Toggle
                  disabled={isToggling}
                  className={(() => {
                    'w-full h-12 transition-colors cursor-pointer'
                    if (assignment.type !== 'assignment') {
                      return 'bg-gray-200 text-gray-700 w-full h-12'
                    }
                    if (!assignment.is_recurring) {
                      return assignment.completed
                        ? 'bg-green-500 text-white w-full h-12'
                        : 'ring-inset ring-1 ring-green-500 text-foreground hover:bg-green-500 hover:text-white w-full h-12'
                    }

                    let dateToCheck = selectedInstanceDate
                    if (!dateToCheck) {
                      const todayStr = format(new Date(), 'yyyy-MM-dd')
                      dateToCheck = todayStr
                    }

                    const isCompleted =
                      assignment.instance_completions?.[dateToCheck]
                        ?.completed || false
                    return isCompleted
                      ? 'bg-green-500 text-white w-full h-12'
                      : 'bg-gray-200 text-gray-700 w-full h-12'
                  })()}
                  data-state={(() => {
                    if (assignment.type !== 'assignment') {
                      return 'unchecked'
                    }
                    if (!assignment.is_recurring) {
                      return assignment.completed ? 'checked' : 'unchecked'
                    }

                    let dateToCheck = selectedInstanceDate
                    if (!dateToCheck) {
                      const todayStr = format(new Date(), 'yyyy-MM-dd')
                      dateToCheck = todayStr
                    }

                    const isCompleted =
                      assignment.instance_completions?.[dateToCheck]
                        ?.completed || false
                    return isCompleted ? 'checked' : 'unchecked'
                  })()}
                  pressed={(() => {
                    if (assignment.type !== 'assignment') {
                      return false
                    }
                    if (!assignment.is_recurring) {
                      return assignment.completed || false
                    }

                    let dateToCheck = selectedInstanceDate
                    if (!dateToCheck) {
                      const todayStr = format(new Date(), 'yyyy-MM-dd')
                      dateToCheck = todayStr
                    }

                    return (
                      assignment.instance_completions?.[dateToCheck]
                        ?.completed || false
                    )
                  })()}
                  onPressedChange={async () => {
                    if (assignment.type !== 'assignment' || isToggling) return

                    console.log('🎯 Toggle pressed for assignment:', {
                      id: assignment.id,
                      title: assignment.title,
                      completed: assignment.completed,
                    })

                    setIsToggling(true)

                    let instanceDate: string | undefined = undefined

                    if (assignment.is_recurring) {
                      instanceDate = selectedInstanceDate

                      // If no instance date is selected, use today's date for today's assignments
                      if (!instanceDate) {
                        instanceDate = format(new Date(), 'yyyy-MM-dd')
                      }
                    }

                    try {
                      // Toggle the assignment
                      await _onToggle(assignment.id, instanceDate)

                      // Close the modal after the toggle completes and any animations finish
                      if (onClose) {
                        // Delay to allow the card to animate back to its position before closing
                        setTimeout(() => {
                          onClose()
                        }, 600) // Increased delay for smoother UX
                      }
                    } finally {
                      setIsToggling(false)
                    }
                  }}
                >
                  {isToggling ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {(() => {
                    if (assignment.type !== 'assignment') {
                      return 'View'
                    }
                    if (isToggling) {
                      return 'Updating...'
                    }
                    if (!assignment.is_recurring) {
                      return assignment.completed ? 'Done' : "I'm Done"
                    }

                    let dateToCheck = selectedInstanceDate
                    if (!dateToCheck) {
                      const todayStr = format(new Date(), 'yyyy-MM-dd')
                      dateToCheck = todayStr
                    }

                    const isCompleted =
                      assignment.instance_completions?.[dateToCheck]
                        ?.completed || false
                    return isCompleted ? 'Done' : "I'm Done"
                  })()}
                </Toggle>
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
        </motion.div>
      </div>
    </>
  )
}

export function AssignmentCardList({
  assignments,
  image,
  onCardClick,
  groupId,
  size = 'small',
  assignmentNotes = [],
  onNoteCreated,
  onToggle,
  recommendations,
}: {
  assignments: Assignment[]
  image: boolean
  onCardClick: (assignmentId: string) => void
  groupId?: string
  size?: 'small' | 'xs'
  assignmentNotes?: Note[]
  onNoteCreated?: () => void
  onToggle?: (id: string, instanceDate?: string) => void
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
              onToggle={onToggle || (() => { })}
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
              onNoteCreated={onNoteCreated}
              assignmentNotes={assignmentNotes}
              expandedCardId={null}
              setExpandedCardId={() => { }}
              selectedInstanceDate={undefined}
              groupId={groupId}
              onClick={() => onCardClick(item.id)}
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
  onNoteCreated,
  onToggle,
  recommendations,
  selectedChildId,
}: {
  assignments: Assignment[]
  image: boolean
  groupId?: string
  size?: 'small' | 'xs'
  assignmentNotes?: Note[]
  onNoteCreated?: () => void
  onToggle?: (id: string, instanceDate?: string) => void
  recommendations?: Recommendation[]
  selectedChildId?: string | null
}) {
  // Debug: Track group re-renders
  console.log(
    '🔄 AssignmentCardGroup rendered with',
    assignments.length,
    'assignments',
  )

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
        onCardClick={openCard}
        groupId={groupId}
        size={size}
        assignmentNotes={assignmentNotes}
        onNoteCreated={onNoteCreated}
        onToggle={onToggle}
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
            onToggle={onToggle || (() => { })}
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
            onNoteCreated={onNoteCreated}
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
  onNoteCreated,
  onToggle,
  recommendations,
  selectedChildId,
}: {
  assignments: Assignment[]
  image: boolean
  groupId?: string
  size?: 'small' | 'xs'
  assignmentNotes?: Note[]
  onNoteCreated?: () => void
  onToggle?: (id: string, instanceDate?: string) => void
  recommendations?: Recommendation[]
  selectedChildId?: string | null
}) {
  // Debug: Track container re-renders
  console.log(
    '🔄 AssignmentCardContainer rendered with',
    assignments.length,
    'assignments',
  )

  return (
    <div id="expanding-card">
      <AssignmentCardGroup
        assignments={assignments}
        image={image}
        groupId={groupId}
        size={size}
        assignmentNotes={assignmentNotes}
        onNoteCreated={onNoteCreated}
        onToggle={onToggle}
        recommendations={recommendations}
        selectedChildId={selectedChildId}
      />
    </div>
  )
}
