'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Eye, EyeOff, Calendar, Link as LinkIcon } from 'lucide-react'
import { format } from 'date-fns'

interface Link {
  title: string
  url: string
}

interface Assignment {
  id: string
  title: string
  content: any
  links: Link[]
  due_date: string
  created_at: string
}

export default function ParentDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [viewMode, setViewMode] = useState<'parent' | 'student'>('parent')
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    content: null as any,
    links: [] as Link[],
    due_date: format(new Date(), 'yyyy-MM-dd')
  })
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  const supabase = createClient()

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('parent_id', user.id)
      .order('due_date', { ascending: false })

    if (!error && data) {
      setAssignments(data)
    }
  }

  const createAssignment = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('assignments')
      .insert({
        parent_id: user.id,
        title: newAssignment.title,
        content: newAssignment.content,
        links: newAssignment.links,
        due_date: newAssignment.due_date
      })

    if (!error) {
      setIsCreating(false)
      setNewAssignment({
        title: '',
        content: null,
        links: [],
        due_date: format(new Date(), 'yyyy-MM-dd')
      })
      fetchAssignments()
    }
  }

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchAssignments()
    }
  }

  const addLink = () => {
    if (newLink.title && newLink.url) {
      setNewAssignment({
        ...newAssignment,
        links: [...newAssignment.links, newLink]
      })
      setNewLink({ title: '', url: '' })
    }
  }

  const removeLink = (index: number) => {
    setNewAssignment({
      ...newAssignment,
      links: newAssignment.links.filter((_, i) => i !== index)
    })
  }

  if (viewMode === 'student') {
    window.location.href = '/student'
    return null
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Parent Dashboard</h1>
        <Button
          variant="outline"
          onClick={() => setViewMode('student')}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Switch to Student View
        </Button>
      </div>

      {!isCreating ? (
        <Button
          onClick={() => setIsCreating(true)}
          className="mb-6 gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Assignment
        </Button>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Assignment</CardTitle>
            <CardDescription>
              Use the WYSIWYG editor to create rich content assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                placeholder="Enter assignment title"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={newAssignment.due_date}
                onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Assignment Content</Label>
              <WysiwygEditor
                content={newAssignment.content}
                onChange={(content) => setNewAssignment({ ...newAssignment, content })}
                placeholder="Type your assignment instructions here..."
              />
            </div>

            <div className="space-y-2">
              <Label>Links & Resources</Label>
              <div className="space-y-2">
                {newAssignment.links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <LinkIcon className="h-4 w-4" />
                    <span className="flex-1">{link.title}</span>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm underline">
                      {link.url}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLink(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Link title"
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  />
                  <Input
                    placeholder="URL"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  />
                  <Button type="button" onClick={addLink}>Add Link</Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={createAssignment}>Save Assignment</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false)
                  setNewAssignment({
                    title: '',
                    content: null,
                    links: [],
                    due_date: format(new Date(), 'yyyy-MM-dd')
                  })
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Existing Assignments</h2>
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{assignment.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAssignment(assignment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            {assignment.links && assignment.links.length > 0 && (
              <CardContent>
                <div className="space-y-1">
                  <span className="text-sm font-medium">Resources:</span>
                  {(assignment.links as Link[]).map((link, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <LinkIcon className="h-3 w-3" />
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {link.title}
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}