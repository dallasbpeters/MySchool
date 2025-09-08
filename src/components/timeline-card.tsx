'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  CardContent,
  CardTitle,
  CardFooter,
  MotionCard,
  MotionCardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link as LinkIcon, BookOpen, Plus, Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { UniversalVideoPlayer } from '@/components/universal-video-player'
import { Toggle } from '@/components/ui/toggle'

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
  layoutID?: string
  recurrence_end_date?: string
  next_due_date?: string
  instance_completions?: Record<
    string,
    { completed: boolean; completed_at?: string; instance_date: string }
  >
  // For ExpandingCard component
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

interface TimelineCardProps {
  id: string
  image: boolean
  showDate: boolean
  assignment: Assignment
  layoutID?: string
  onToggle: (id: string, instanceDate?: string) => void
  getDateLabel: (date: string, completed?: boolean) => string
  getDateColor: (date: string, completed?: boolean) => string
  cardIndex?: number
  expandedCardId: string | null
  setExpandedCardId: (id: string | null) => void
  onNoteCreated?: () => void
  assignmentNotes?: Note[]
  selectedInstanceDate?: string
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

export default function TimelineCard({
  id,
  assignment,
  onToggle,
  expandedCardId,
  setExpandedCardId,
  onNoteCreated,
  assignmentNotes = [],
  selectedInstanceDate,
}: TimelineCardProps) {
  const expanded = expandedCardId === assignment.id
  const cardRef = useRef<HTMLDivElement>(null)
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [newNote, setNewNote] = useState<{
    title: string
    content: string | null
  }>({ title: '', content: null })
  const { toast } = useToast()

  // Filter notes that belong directly to this assignment
  const relatedNotes = assignmentNotes.filter((note) => {
    // First check for direct assignment association
    if (note.assignment_id) {
      return note.assignment_id === assignment.id
    }

    // Fallback to category matching for legacy notes
    const assignmentCategory = assignment.category?.trim() || 'General'
    const noteCategory = note.category?.trim() || 'General'
    return noteCategory === assignmentCategory
  })

  const handleToggleExpand = () => {
    // Toggle expanded state
    if (expanded) {
      setExpandedCardId(null)
    } else {
      setExpandedCardId(assignment.id)
    }
  }

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

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newNote.title.trim(),
          content: newNote.content,
          category,
          assignment_id: assignment.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message || 'Note created successfully',
        })
        setNewNote({ title: '', content: null })
        setIsCreatingNote(false)
        if (onNoteCreated) {
          onNoteCreated()
        }
      } else {
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
        variant: 'destructive',
      })
    }
  }

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

  const isCompletedRecurring =
    assignment.completed && assignment.is_recurring && expanded

  return (
    <motion.div className="h-full">
      <MotionCard
        layout
        id={id}
        ref={cardRef}
        initial={false}
        animate={{
          opacity: 1,
          y: 0,
        }}
        onClick={expanded ? undefined : handleToggleExpand}
        className={`max-w-3xl w-full margin-auto overflow-hidden relative pb-3 ${expanded ? 'shadow-lg ring-0! border-0' : ''} ${assignment.completed ? 'completed bg-muted/30 opacity-75' : ''} ${isCompletedRecurring ? 'border-green-200' : ''}`}
      >
        {expanded && (
          <Button
            onClick={handleToggleExpand}
            className="cursor-pointer h-10 w-10 absolute top-2 right-2 bg-black/80 hover:bg-black transition-colors z-50"
          >
            <X className="h-4 w-4 text-white" />
          </Button>
        )}

        <MotionCardHeader className="cursor-pointer z-5 gap-0">
          <CardTitle
            className={`text-md mb-0 ${assignment.completed ? 'line-through text-muted-foreground' : ''} group:hover-text-primary flex flex-col items-start gap-2`}
          >
            {assignment.title}
          </CardTitle>
        </MotionCardHeader>

        {(assignment.content ||
          (assignment.links && assignment.links.length > 0)) && (
          <div
            className={`overflow-auto transition-all duration-300 ease-in-out ${
              expanded ? 'max-h-[unset] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <CardContent className="flex flex-col gap-2 justify-end z-5 overflow-y-auto pt-0">
              <div className="space-y-3 pb-4">
                {assignment.content && <EditorContent editor={editor} />}

                {assignment.links && assignment.links.length > 0 && (
                  <div className="flex gap-2 items-center flex-wrap">
                    {assignment.links.map((link, index) => {
                      const isVideo = link.type === 'video'

                      if (isVideo) {
                        return (
                          <UniversalVideoPlayer
                            key={index}
                            url={link.url}
                            title={link.title}
                          />
                        )
                      } else {
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm"
                          >
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
                      <div
                        key={note.id}
                        className="bg-secondary rounded-md p-4"
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col space-y-2 border-t border-gray-200 dark:border-gray-400">
              <div className="flex items-center justify-between w-full">
                <Toggle
                  className={(() => {
                    if (!assignment.is_recurring) {
                      return assignment.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
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
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  })()}
                  data-state={(() => {
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
                  onPressedChange={() => {
                    let instanceDate: string | undefined = undefined

                    if (assignment.is_recurring) {
                      instanceDate = selectedInstanceDate

                      // If no instance date is selected, use today's date for today's assignments
                      if (!instanceDate) {
                        instanceDate = format(new Date(), 'yyyy-MM-dd')
                      }
                    }

                    onToggle(assignment.id, instanceDate)
                  }}
                >
                  <Check className="h-4 w-4" />
                  {(() => {
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
                <div
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
                </div>
              )}
            </CardFooter>
          </div>
        )}
      </MotionCard>
    </motion.div>
  )
}
