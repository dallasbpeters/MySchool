'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Plus, Trash2, Eye, Calendar, Link as LinkIcon, Users, Repeat } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { MiniCalendar, MiniCalendarNavigation, MiniCalendarDays, MiniCalendarDay } from '@/components/ui/shadcn-io/mini-calendar'

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
  is_recurring?: boolean
  recurrence_pattern?: {
    days: string[] // ['monday', 'wednesday', 'friday']
    frequency?: 'weekly' | 'daily'
  }
  recurrence_end_date?: string
  next_due_date?: string
}

interface Child {
  id: string
  name: string
  email: string
}

export default function ParentDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [viewMode, setViewMode] = useState<'parent' | 'student'>('parent')
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    content: null as any,
    links: [] as Link[],
    due_date: format(new Date(), 'yyyy-MM-dd'),
    selectedChildren: [] as string[],
    is_recurring: false,
    recurrence_pattern: {
      days: [] as string[],
      frequency: 'weekly' as 'weekly' | 'daily'
    },
    recurrence_end_date: ''
  })
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date())
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  const supabase = createClient()

  useEffect(() => {
    fetchAssignments()
    fetchChildren()
  }, [])

  // Update due date when calendar date is selected
  useEffect(() => {
    if (selectedCalendarDate) {
      setNewAssignment(prev => ({
        ...prev,
        due_date: format(selectedCalendarDate, 'yyyy-MM-dd')
      }))
    }
  }, [selectedCalendarDate])

  const fetchChildren = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('parent_id', user.id)
      .eq('role', 'student')

    if (!error && data) {
      setChildren(data as Child[])
    }
  }

  const fetchAssignments = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('parent_id', user.id)
      .order('due_date', { ascending: false })

    if (!error && data) {
      setAssignments(data as unknown as Assignment[])
    }
  }

  const createAssignment = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Create the assignment
    const { data: assignmentData, error } = await supabase
      .from('assignments')
      .insert({
        parent_id: user.id,
        title: newAssignment.title,
        content: newAssignment.content,
        links: newAssignment.links as any,
        due_date: newAssignment.due_date,
        is_recurring: newAssignment.is_recurring,
        recurrence_pattern: newAssignment.is_recurring ? newAssignment.recurrence_pattern as any : null,
        recurrence_end_date: newAssignment.is_recurring && newAssignment.recurrence_end_date ? newAssignment.recurrence_end_date : null,
        next_due_date: newAssignment.is_recurring ? newAssignment.due_date : null
      })
      .select()
      .single()

    if (!error && assignmentData) {
      // Create student assignments for selected children
      if (newAssignment.selectedChildren.length > 0) {
        const studentAssignments = newAssignment.selectedChildren.map(childId => ({
          assignment_id: assignmentData.id,
          student_id: childId,
          completed: false
        }))

        await supabase
          .from('student_assignments')
          .insert(studentAssignments as any)
      }

      setIsCreating(false)
      setNewAssignment({
        title: '',
        content: null,
        links: [],
        due_date: format(new Date(), 'yyyy-MM-dd'),
        selectedChildren: [],
        is_recurring: false,
        recurrence_pattern: {
          days: [],
          frequency: 'weekly'
        },
        recurrence_end_date: ''
      })
      setSelectedCalendarDate(new Date())
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
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Parent Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/parent/children">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Manage Children
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => setViewMode('student')}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Switch to Student View
          </Button>
        </div>
      </div>

      <Sheet open={isCreating} onOpenChange={setIsCreating}>
        <SheetTrigger asChild>
          <Button className="mb-6 gap-2">
            <Plus className="h-4 w-4" />
            Create New Assignment
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[600px] sm:w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Assignment</SheetTitle>
            <SheetDescription>
              Use the WYSIWYG editor to create rich content assignments
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
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
                onChange={(e) => {
                  setNewAssignment({ ...newAssignment, due_date: e.target.value })
                  setSelectedCalendarDate(new Date(e.target.value))
                }}
              />

              {/* Mini Calendar */}
              <div className="mt-2">
                <Label className="text-sm text-muted-foreground mb-1 block">Quick Date Selection</Label>
                <MiniCalendar
                  value={selectedCalendarDate}
                  onValueChange={setSelectedCalendarDate}
                  className="w-fit"
                >
                  <MiniCalendarNavigation direction="prev" />
                  <MiniCalendarDays>
                    {(date) => <MiniCalendarDay key={date.toISOString()} date={date} />}
                  </MiniCalendarDays>
                  <MiniCalendarNavigation direction="next" />
                </MiniCalendar>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={newAssignment.is_recurring}
                  onChange={(e) => setNewAssignment({ ...newAssignment, is_recurring: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_recurring" className="flex items-center gap-2 cursor-pointer">
                  <Repeat className="h-4 w-4" />
                  Make this a recurring assignment
                </Label>
              </div>

              {newAssignment.is_recurring && (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Repeat on days of the week:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <label key={day} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={newAssignment.recurrence_pattern.days.includes(day)}
                            onChange={(e) => {
                              const updatedDays = e.target.checked
                                ? [...newAssignment.recurrence_pattern.days, day]
                                : newAssignment.recurrence_pattern.days.filter(d => d !== day)
                              setNewAssignment({
                                ...newAssignment,
                                recurrence_pattern: {
                                  ...newAssignment.recurrence_pattern,
                                  days: updatedDays
                                }
                              })
                            }}
                            className="rounded"
                          />
                          <span className="capitalize">{day.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurrence_end_date" className="text-sm font-medium">Stop repeating after (optional):</Label>
                    <Input
                      id="recurrence_end_date"
                      type="date"
                      value={newAssignment.recurrence_end_date}
                      onChange={(e) => setNewAssignment({ ...newAssignment, recurrence_end_date: e.target.value })}
                      min={newAssignment.due_date}
                    />
                  </div>
                </div>
              )}
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
              <Label>Assign to Children</Label>
              <div className="space-y-2">
                {children.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No children added yet. <Link href="/parent/children" className="underline">Add children</Link> to assign tasks.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2 mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewAssignment({
                          ...newAssignment,
                          selectedChildren: children.map(c => c.id)
                        })}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewAssignment({
                          ...newAssignment,
                          selectedChildren: []
                        })}
                      >
                        Clear All
                      </Button>
                    </div>
                    {children.map((child) => (
                      <label key={child.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAssignment.selectedChildren.includes(child.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewAssignment({
                                ...newAssignment,
                                selectedChildren: [...newAssignment.selectedChildren, child.id]
                              })
                            } else {
                              setNewAssignment({
                                ...newAssignment,
                                selectedChildren: newAssignment.selectedChildren.filter(id => id !== child.id)
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{child.name}</span>
                        <span className="text-xs text-muted-foreground">({child.email})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
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
                    due_date: format(new Date(), 'yyyy-MM-dd'),
                    selectedChildren: [],
                    is_recurring: false,
                    recurrence_pattern: {
                      days: [],
                      frequency: 'weekly'
                    },
                    recurrence_end_date: ''
                  })
                  setSelectedCalendarDate(new Date())
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Existing Assignments</h2>
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {assignment.title}
                    {assignment.is_recurring && (
                      <Repeat className="h-4 w-4 text-blue-500" />
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                    {assignment.is_recurring && assignment.recurrence_pattern?.days && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Repeats {assignment.recurrence_pattern.days.join(', ')}
                      </span>
                    )}
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
