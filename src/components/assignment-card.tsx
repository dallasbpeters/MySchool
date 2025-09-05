'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardMedia, CardFooter } from '@/components/ui/card'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { StickyNote, Calendar, CheckCircle2, Link as LinkIcon, BookOpen, Plus, Trash2, Repeat, Check } from 'lucide-react'
import { format } from 'date-fns'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { UniversalVideoPlayer } from '@/components/universal-video-player'
import { Badge } from '@/components/ui/badge'
import { Toggle } from "@/components/ui/toggle"

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
  assignment: Assignment
  onToggle: (id: string, instanceDate?: string) => void
  getDateLabel: (date: string, completed?: boolean) => string
  getDateColor: (date: string, completed?: boolean) => string
  imageIndex?: number
  expandedCardId: string | null
  setExpandedCardId: (id: string | null) => void
  onNoteCreated?: () => void
  assignmentNotes?: Note[]
  selectedInstanceDate?: string
}

// Separate component for rendering note content to avoid hook rule violations
function NoteContent({ content }: { content: string | null }) {
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

export default function AssignmentCard({
  assignment,
  onToggle,
  getDateLabel,
  getDateColor,
  imageIndex = 0,
  expandedCardId,
  setExpandedCardId,
  image,
  showDate,
  onNoteCreated,
  assignmentNotes = [],
  selectedInstanceDate
}: AssignmentCardProps) {
  const expanded = expandedCardId === assignment.id
  const cardRef = useRef<HTMLDivElement>(null)
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [newNote, setNewNote] = useState<{ title: string; content: string | null }>({ title: '', content: null })
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
    '/risky-ming--AsW_zqKQ9E-unsplash.svg',
    '/risky-ming-fFa5xAoT8ms-unsplash.svg',
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
    } catch (_error) {
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
    <Card ref={cardRef} id={`assignment-${assignment.id}`} className={`self-start overflow-hidden relative md:pb-0 ${expanded ? 'md:pb-6 shadow-lg ring-0!' : ''} ${assignment.completed ? 'bg-muted/30 opacity-75' : ''} ${isCompletedRecurring ? 'border-green-200' : ''}`}>
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
      {assignment.is_recurring && (
        <div className="absolute top-4 left-4 p-1 bg-background rounded-full">
          <Repeat className=" h-4 w-4 text-white" />
        </div>
      )}

      <CardHeader onClick={handleToggleExpand} className="cursor-pointer pb-3 z-10">
        <div className="flex items-start gap-3">
          <div className="grow-1">
            <CardTitle className={`text-lg ${assignment.completed ? 'line-through text-muted-foreground' : ''} group:hover-text-primary flex items-center gap-2`}>
              <span className="line-clamp-4 md:line-clamp-3">
                {assignment.title}
              </span>
              {isCompletedRecurring && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Will hide when closed
                </span>
              )}

              {assignment.category && (
                <>
                  <Badge variant="outline">
                    <span
                      className="size-1.5 rounded-full bg-green-500"
                      aria-hidden="true"
                    ></span>
                    {assignment.category}
                  </Badge>
                </>
              )}
            </CardTitle>
            {showDate && (
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
            )}
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
              <Toggle
                className="bg-primary"
                data-state={(() => {
                  if (!assignment.is_recurring) {
                    return assignment.completed ? 'checked' : 'unchecked'
                  }

                  let dateToCheck = selectedInstanceDate
                  if (!dateToCheck) {
                    const todayStr = format(new Date(), 'yyyy-MM-dd')
                    dateToCheck = todayStr
                  }

                  const isCompleted = assignment.instance_completions?.[dateToCheck]?.completed || false
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

                  return assignment.instance_completions?.[dateToCheck]?.completed || false
                })()}
                onPressedChange={(pressed) => {
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

                  const isCompleted = assignment.instance_completions?.[dateToCheck]?.completed || false
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
