'use client'

import { useState, useEffect } from 'react'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import MultipleSelector, { Option } from '@/components/ui/multiselect'
import { Plus, Trash2, Calendar, Link as LinkIcon, Repeat, Edit, Video, Play } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { MiniCalendar, MiniCalendarNavigation, MiniCalendarDays, MiniCalendarDay } from '@/components/ui/shadcn-io/mini-calendar'
import { ChartLineInteractive } from '@/components/ui/shadcn-io/line-chart-01';
import { useToast } from '@/hooks/use-toast'
import PageGrid from '@/components/page-grid'

interface Link {
  title: string
  url: string
  type?: 'link' | 'video'
}

interface Assignment {
  id: string
  title: string
  content: string | null
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
  parent_name?: string // For admin view
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
  const [userRole, setUserRole] = useState<string>('')
  const [selectedParent, setSelectedParent] = useState<string>('all')
  const [availableParents, setAvailableParents] = useState<Option[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    content: null,
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
  const [newLink, setNewLink] = useState({ title: '', url: '', type: 'link' as 'link' | 'video' })
  const { toast } = useToast()

  // Filter assignments based on selected parent (admin only)
  const filteredAssignments = userRole === 'admin' && selectedParent !== 'all'
    ? assignments.filter(assignment => assignment.parent_name === selectedParent)
    : assignments

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


      // First get user profile to determine role
      const profileResponse = await fetch('/api/assignments')
      const profileData = await profileResponse.json()
      const role = profileData.profile?.role

      setUserRole(role)

      let assignmentsData = []
      const parentNames = new Set<string>()

      if (role === 'admin') {
        // Admin: fetch from admin API to get all assignments with parent names
        const adminResponse = await fetch('/api/admin/assignments')
        const adminData = await adminResponse.json()



        assignmentsData = adminData.assignments || []

        // Extract unique parent names for filter
        adminData.assignments?.forEach((assignment: Assignment) => {
          if (assignment.parent_name) {
            parentNames.add(assignment.parent_name)
          }
        })
      } else {
        // Parent: fetch from regular API

        assignmentsData = profileData.assignments || []
      }

      // Update available parents for admin filter
      if (role === 'admin') {
        const parentOptions = Array.from(parentNames)
          .sort()
          .map(name => ({ label: name, value: name }))
        setAvailableParents([
          { label: 'All Parents', value: 'all' },
          ...parentOptions
        ])
      }

      setAssignments(assignmentsData)


    } catch (error) {

    }
  }


  const createOrUpdateAssignment = async () => {
    setIsSaving(true)

    // Validation
    if (!newAssignment.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an assignment title",
        variant: "destructive"
      })
      setIsSaving(false)
      return
    }

    if (newAssignment.is_recurring && newAssignment.recurrence_pattern.days.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one day for the recurring assignment",
        variant: "destructive"
      })
      setIsSaving(false)
      return
    }

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

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `An unexpected error occurred while ${editingAssignment ? 'updating' : 'creating'} the assignment`
      toast({
        title: "Error",
        description: errorMessage,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete assignment"
      toast({
        title: "Error",
        description: errorMessage,
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
      setNewLink({ title: '', url: '', type: 'link' })
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
      content: null,
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
    <>
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

              <div className="grid mt-6 flex-1 auto-rows-min gap-4">
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

                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Assignment Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${!newAssignment.is_recurring
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                          }`}
                        onClick={() => setNewAssignment({ ...newAssignment, is_recurring: false })}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium text-sm">One-time Assignment</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Has a specific due date</p>
                      </div>

                      <div
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${newAssignment.is_recurring
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                          }`}
                        onClick={() => setNewAssignment({ ...newAssignment, is_recurring: true })}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Repeat className="h-4 w-4" />
                          <span className="font-medium text-sm">Recurring Assignment</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Repeats on selected days</p>
                      </div>
                    </div>
                  </div>

                  {!newAssignment.is_recurring && (
                    <div className="space-y-2">
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
                  )}

                </div>

                {newAssignment.is_recurring && (
                  <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Label className="text-sm text-foreground mb-1 block">Start Date</Label>
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
                      <p className="text-xs text-muted-foreground">The recurring pattern will begin on this date</p>
                    </div>

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


                <div className="space-y-2">
                  <Label>Assignment Content</Label>
                  <WysiwygEditor
                    content={newAssignment.content}
                    onChange={(content) => setNewAssignment({ ...newAssignment, content })}
                    placeholder="Type your assignment instructions here..."
                  />
                </div>

                <div className="space-y-2 mt-4">
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

                <div className="space-y-2 mt-4">
                  <Label>Links & Resources</Label>
                  <div className="space-y-2">
                    {newAssignment.links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        {link.type === 'video' ? (
                          <Video className="h-4 w-4 text-red-500" />
                        ) : (
                          <LinkIcon className="h-4 w-4" />
                        )}
                        <span className="flex-1">{link.title}</span>
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-background rounded">
                          {link.type === 'video' ? 'Video' : 'Link'}
                        </span>
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
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={newLink.type === 'link' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNewLink({ ...newLink, type: 'link' })}
                          className="gap-1"
                        >
                          <LinkIcon className="h-3 w-3" />
                          Link
                        </Button>
                        <Button
                          type="button"
                          variant={newLink.type === 'video' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNewLink({ ...newLink, type: 'video' })}
                          className="gap-1"
                        >
                          <Video className="h-3 w-3" />
                          Video
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder={newLink.type === 'video' ? 'Video title' : 'Link title'}
                          value={newLink.title}
                          onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                        />
                        <Input
                          placeholder={newLink.type === 'video' ? 'YouTube URL' : 'URL'}
                          value={newLink.url}
                          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        />
                        <Button type="button" onClick={addLink}>
                          Add {newLink.type === 'video' ? 'Video' : 'Link'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>


              </div>

              <SheetFooter className="border-t border-border mt-4 py-4 bg-background">
                <Button
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button onClick={createOrUpdateAssignment} disabled={isSaving}>
                  {isSaving ? 'Saving...' : (editingAssignment ? 'Update Assignment' : 'Save Assignment')}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {
          filteredAssignments.length > 0 && (
            <Card className="mb-4">
              <CardContent>
                <ChartLineInteractive />
              </CardContent>
            </Card>
          )
        }

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-semibold">Assignments</h2>
            {userRole === 'admin' && availableParents.length > 1 && (
              <div className="flex items-center gap-2">
                <Label htmlFor="parent-filter" className="text-sm font-medium whitespace-nowrap">Filter by Parent:</Label>
                <MultipleSelector
                  value={selectedParent === 'all' ? [] : [{ label: selectedParent, value: selectedParent }]}
                  onChange={(selected) => {
                    setSelectedParent(selected.length > 0 ? selected[0].value : 'all')
                  }}
                  options={availableParents}
                  placeholder="Select parent..."
                  className="w-100"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="group">
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
                      {userRole === 'admin' && assignment.parent_name && (
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                          Created by: {assignment.parent_name}
                        </CardDescription>
                      )}
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
      </div >
      <PageGrid variant="grid" />
    </>
  )
}
