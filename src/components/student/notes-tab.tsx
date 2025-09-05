'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, Calendar, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { NoteService, Note, GroupedNotes } from '@/services/note-service'
import { Assignment } from '@/types'

interface NotesTabProps {
  notes: Note[]
  assignments: Assignment[]
  editingNote: Note | null
  editNoteData: { title: string; content: string }
  setEditNoteData: (data: { title: string; content: string }) => void
  onStartEdit: (note: Note) => void
  onCancelEdit: () => void
  onUpdateNote: () => void
  onDeleteNote: (noteId: string) => void
}

// Note content component
function NoteContent({ content }: { content: string }) {
  try {
    const parsedContent = JSON.parse(content)
    if (parsedContent?.type === 'doc' && parsedContent?.content) {
      // Extract text from ProseMirror JSON
      const extractText = (node: any): string => {
        if (node.type === 'text') {
          return node.text || ''
        }
        if (node.content && Array.isArray(node.content)) {
          return node.content.map(extractText).join('')
        }
        return ''
      }

      const text = parsedContent.content.map(extractText).join('\n')
      return <p className="whitespace-pre-wrap">{text}</p>
    }
  } catch {
    // If not valid JSON, treat as plain text
  }

  return <p className="whitespace-pre-wrap">{content}</p>
}

export function NotesTab({
  notes,
  assignments,
  editingNote,
  editNoteData,
  setEditNoteData,
  onStartEdit,
  onCancelEdit,
  onUpdateNote,
  onDeleteNote
}: NotesTabProps) {
  const groupedNotes = NoteService.groupByCategory(notes)
  const categories = Object.keys(groupedNotes)

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No notes yet. Add notes to assignments to see them here!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue={categories[0]} className="w-full bg-background">
      <TabsList className="bg-background">
        {categories.map((category) => (
          <TabsTrigger key={category} value={category}>
            {category} ({groupedNotes[category].length})
          </TabsTrigger>
        ))}
      </TabsList>

      {Object.entries(groupedNotes).map(([category, categoryNotes]) => (
        <TabsContent key={category} value={category} className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {categoryNotes.map((note) => (
              <Card key={note.id}>
                <CardHeader className="mb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStartEdit(note)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteNote(note.id)}
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
                      <Button variant="outline" onClick={onCancelEdit}>
                        Cancel
                      </Button>
                      <Button onClick={onUpdateNote}>
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
  )
}
