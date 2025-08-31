'use client'

import { useState, useEffect } from 'react'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import MultipleSelector, { Option } from '@/components/ui/multiselect'
import { Plus, Trash2, Calendar, Link as LinkIcon, Repeat, Edit } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { MiniCalendar, MiniCalendarNavigation, MiniCalendarDays, MiniCalendarDay } from '@/components/ui/shadcn-io/mini-calendar'
import { ChartLineInteractive } from '@/components/ui/shadcn-io/line-chart-01';
import { useToast } from '@/hooks/use-toast'

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
  category?: string
  is_recurring?: boolean
  recurrence_pattern?: {
    days: string[] // ['monday', 'wednesday', 'friday']
    frequency?: 'weekly' | 'daily'
  }
  recurrence_end_date?: string
  next_due_date?: string
  assigned_children?: string[]
}

interface Child {
  id: string
  name: string
  email: string
}

export default function ParentDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    content: null as any,
    links: [] as Link[],
    due_date: format(new Date(), 'yyyy-MM-dd'),
    category: [] as Option[],
    selectedChildren: [] as Option[],
    is_recurring: false,
    recurrence_pattern: {
      days: [] as string[],
      frequency: 'weekly' as 'weekly' | 'daily'
    },
    recurrence_end_date: ''
  })
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date())
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  const { toast } = useToast()

  useEffect(() => {
    fetchAssignments()
    fetchChildren()
    fetchCategories()
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
    try {
      const response = await fetch('/api/children')
      const data = await response.json()

      if (data.children) {
        setChildren(data.children)
      }
    } catch (error) {
      // Handle error silently
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/assignments')
      const data = await response.json()

      if (data.assignments) {
        const uniqueCategories = [...new Set(
          data.assignments
            .map((a: Assignment) => a.category)
            .filter((c: string) => c && c.trim())
        )]
        setCategories(
          uniqueCategories.map((cat: string) => ({ label: cat, value: cat }))
        )
      }
    } catch (error) {
      // Handle error silently
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/assignments')
      const data = await response.json()

      if (data.assignments) {
        setAssignments(data.assignments)
      }
    } catch (error) {
      // Handle error silently
    }
  }


  const createOrUpdateAssignment = async () => {
    setIsSaving(true)

    try {
      const isEditing = !!editingAssignment
      const url = isEditing ? `/api/assignments?id=${editingAssignment.id}` : '/api/assignments'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newAssignment.title,
          content: newAssignment.content,
          links: newAssignment.links,
          due_date: newAssignment.due_date,
          category: newAssignment.category.length > 0 ? newAssignment.category[0].value : '',
          selectedChildren: newAssignment.selectedChildren.map(child => child.value),
          is_recurring: newAssignment.is_recurring,
          recurrence_pattern: newAssignment.is_recurring ? newAssignment.recurrence_pattern : null,
          recurrence_end_date: newAssignment.is_recurring && newAssignment.recurrence_end_date ? newAssignment.recurrence_end_date : null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Assignment ${isEditing ? 'update' : 'creation'} failed`)
      }

      // Success!
      toast({
        title: "Success",
        description: data.message || `Assignment ${isEditing ? 'updated' : 'created'} successfully`,
      })

      resetForm()
      fetchAssignments()

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `An unexpected error occurred while ${editingAssignment ? 'updating' : 'creating'} the assignment`,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteAssignment = async (id: string) => {
    try {
      const response = await fetch(`/api/assignments?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Delete failed')
      }

      toast({
        title: "Success",
        description: data.message || "Assignment deleted successfully",
      })

      fetchAssignments()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete assignment",
        variant: "destructive"
      })
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

  const startEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment)

    // Find the child options that are currently assigned to this assignment
    const assignedChildOptions = children
      .filter(child => assignment.assigned_children?.includes(child.name))
      .map(child => ({ label: child.name, value: child.id }))

    // Convert category string to Option array
    const categoryOptions = assignment.category ?
      [{ label: assignment.category, value: assignment.category }] : []

    setNewAssignment({
      title: assignment.title,
      content: assignment.content,
      links: assignment.links || [],
      due_date: assignment.due_date,
      category: categoryOptions,
      selectedChildren: assignedChildOptions,
      is_recurring: assignment.is_recurring || false,
      recurrence_pattern: {
        days: assignment.recurrence_pattern?.days || [],
        frequency: assignment.recurrence_pattern?.frequency || 'weekly'
      },
      recurrence_end_date: assignment.recurrence_end_date || ''
    })
    setIsCreating(true)
  }

  const resetForm = () => {
    setEditingAssignment(null)
    setNewAssignment({
      title: '',
      content: null as any,
      links: [] as Link[],
      due_date: format(new Date(), 'yyyy-MM-dd'),
      category: [] as Option[],
      selectedChildren: [] as Option[],
      is_recurring: false,
      recurrence_pattern: {
        days: [] as string[],
        frequency: 'weekly' as 'weekly' | 'daily'
      },
      recurrence_end_date: ''
    })
    setIsCreating(false)
  }


  return (
    <div className="z-10 relative container mx-auto p-4 max-w-6xl">
      <div className="gap-4 flex md:flex-row flex-col justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold">Parent Dashboard</h1>
        <Sheet open={isCreating} onOpenChange={setIsCreating}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Assignment
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:w-[700px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}</SheetTitle>
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
                <Label htmlFor="category">Category</Label>
                <MultipleSelector
                  value={newAssignment.category}
                  onChange={(selected) => setNewAssignment({ ...newAssignment, category: selected })}
                  options={categories}
                  placeholder="Select or create categories..."
                  creatable
                  maxSelected={1}
                />
              </div>

              <div className="space-y-2">

                {/* Mini Calendar */}
                <div className="mt-2">
                  <Label className="text-sm text-foreground mb-1 block">Due Date</Label>
                  <MiniCalendar
                    value={selectedCalendarDate}
                    onValueChange={setSelectedCalendarDate}
                    className="w-full"
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
                      <Label className="text-sm font-medium">Select recurring days:</Label>
                      <div className="w-full flex items-center justify-center gap-2 rounded-lg border bg-background p-2">
                        <div className="flex items-center justify-between gap-1">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                            const isSelected = newAssignment.recurrence_pattern.days.includes(day)
                            return (
                              <Button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const updatedDays = newAssignment.recurrence_pattern.days.includes(day)
                                    ? newAssignment.recurrence_pattern.days.filter(d => d !== day)
                                    : [...newAssignment.recurrence_pattern.days, day]

                                  setNewAssignment({
                                    ...newAssignment,
                                    recurrence_pattern: {
                                      ...newAssignment.recurrence_pattern,
                                      days: updatedDays
                                    }
                                  })
                                }}
                                className="h-auto min-w-[3rem] flex-col gap-0 p-2 text-xs"
                                size="sm"
                                variant={isSelected ? 'default' : 'ghost'}
                              >
                                <span className={`font-medium text-[10px] text-muted-foreground ${isSelected ? 'text-primary-foreground/70' : ''}`}>
                                  {day.slice(0, 3).toUpperCase()}
                                </span>
                                <span className="font-semibold text-sm">{day.slice(0, 1).toUpperCase()}</span>
                              </Button>
                            )
                          })}
                        </div>
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
                {children.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No children added yet. <Link href="/parent/children" className="underline">Add children</Link> to assign tasks.
                  </p>
                ) : (
                  <MultipleSelector
                    value={newAssignment.selectedChildren}
                    onChange={(selected) => setNewAssignment({ ...newAssignment, selectedChildren: selected })}
                    options={children.map(child => ({ label: `${child.name} (${child.email})`, value: child.id }))}
                    placeholder="Select children to assign..."
                  />
                )}
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
                <Button onClick={createOrUpdateAssignment} disabled={isSaving}>
                  {isSaving ? 'Saving...' : (editingAssignment ? 'Update Assignment' : 'Save Assignment')}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {assignments.length > 0 && (
        <Card className="mb-4">
          <CardContent>
            <ChartLineInteractive />
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Assignments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
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
                    </CardDescription>
                  </div>
                  <div className="flex gap-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden group-hover:block group-hover:text-foreground"
                      onClick={() => startEditAssignment(assignment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden group-hover:block group-hover:text-foreground"
                      onClick={() => deleteAssignment(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {assignment.assigned_children && assignment.assigned_children.length > 0 && (
                <CardContent>
                  <div className="space-y-1 flex items-center gap-2">
                    <span className="text-sm font-medium">Assigned to:</span>
                    <div className="flex flex-wrap gap-2">
                      {assignment.assigned_children.map((childName, index) => (
                        <span key={index} className="bg-primary/30 text-foreground text-xs px-2 py-0.5 rounded-full leading-4">
                          {childName}
                        </span>
                      ))}
                      {assignment.category && (
                        <span className="flex items-center gap-1 whitespace-nowrap text-xs border border-primary/30 text-foreground px-2 py-0.5 rounded-full leading-4">
                          {assignment.category}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
