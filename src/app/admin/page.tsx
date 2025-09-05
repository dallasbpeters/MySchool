'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Option } from '@/components/ui/multiselect'
import { AssignmentForm } from '@/components/assignment-form'
import { Plus, Trash2, Calendar, Repeat, Edit, Users, Shield, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PageGrid from '@/components/page-grid'
import ColourfulText from '@/components/ui/colourful-text'
interface Link {
  title: string
  url: string
  type?: 'link' | 'video'
}

interface ChildDetail {
  id: string
  name: string
  parent_id: string
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
    days: string[]
    frequency?: 'weekly' | 'daily'
  }
  recurrence_end_date?: string
  next_due_date?: string
  assigned_children?: string[]
  assigned_children_details?: ChildDetail[]
  parent_name?: string
}

interface Family {
  parent_id: string
  parent_name: string
  parent_email: string
  children: Array<{
    id: string
    name: string
    email: string
  }>
}

export default function AdminDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [userRole, setUserRole] = useState<string>('checking')
  const [loading, setLoading] = useState(true)
  const [selectedFamily, setSelectedFamily] = useState<string>('all')
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
  // Temporarily comment out unused link state
  // const [newLink, setNewLink] = useState({ title: '', url: '', type: 'link' as 'link' | 'video' })
  const { toast } = useToast()

  const checkAdminAccess = useCallback(async () => {
    try {
      // Try to fetch admin assignments directly - this will verify admin role
      const response = await fetch('/api/admin/assignments')

      if (!response.ok) {
        // Handle non-2xx responses
        setUserRole('parent')
        return
      }

      const data = await response.json()

      if (data.assignments) {
        setUserRole('admin')
        setAssignments(data.assignments)
        await fetchAllFamilies() // Make sure families are loaded before enabling edit
        fetchCategories()
      } else {
        // Not admin or error
        setUserRole('unauthorized')

      }
    } catch (error) {
      console.error('Failed to check admin access:', error)
      setUserRole('unauthorized')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAdminAccess()
  }, [checkAdminAccess])

  // Update due date when calendar date is selected
  useEffect(() => {
    if (selectedCalendarDate) {
      const formattedDate = format(selectedCalendarDate, 'yyyy-MM-dd')
      console.log('DATE DEBUG:', {
        selectedCalendarDate,
        formattedDate,
        selectedYear: selectedCalendarDate.getFullYear(),
        selectedMonth: selectedCalendarDate.getMonth() + 1,
        selectedDay: selectedCalendarDate.getDate()
      })
      setNewAssignment(prev => ({
        ...prev,
        due_date: formattedDate
      }))
    }
  }, [selectedCalendarDate])

  const fetchAllAssignments = async () => {
    try {
      const response = await fetch('/api/admin/assignments')

      if (!response.ok) {
        console.error('Failed to fetch assignments:', response.status)
        return
      }

      const data = await response.json()

      if (data.assignments) {
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
    }
  }

  const fetchAllFamilies = async () => {
    try {
      const response = await fetch('/api/admin/families')

      if (!response.ok) {
        console.error('Failed to fetch families:', response.status)
        return
      }

      const data = await response.json()


      if (data.families) {
        setFamilies(data.families)
      }
    } catch (error) {
      console.error('Failed to fetch families:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/assignments')

      if (!response.ok) {
        console.error('Failed to fetch categories:', response.status)
        return
      }

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
      console.error('Failed to fetch assignments:', error)
    }
  }


  // Show loading while checking access
  if (userRole === 'checking') {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Checking Access...</h2>
            <p className="text-muted-foreground">
              Verifying your admin privileges
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show unauthorized message for non-admins
  if (userRole !== 'admin') {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don&apos;t have admin privileges to access this page.
            </p>
            <p className="text-sm text-muted-foreground">
              Current role: {userRole || 'Unknown'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
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

    if (newAssignment.selectedChildren.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student for this assignment",
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
      const url = isEditing ? `/api/admin/assignments?id=${editingAssignment.id}` : '/api/admin/assignments'
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Assignment ${isEditing ? 'update' : 'creation'} failed`)
      }

      const data = await response.json()

      // Success!
      toast({
        title: "Success",
        description: data.message || `Assignment ${isEditing ? 'updated' : 'created'} successfully`,
      })

      resetForm()
      fetchAllAssignments()

    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as Error).message || `An unexpected error occurred while ${editingAssignment ? 'updating' : 'creating'} the assignment`,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteAssignment = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/assignments?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Delete failed')
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Assignment deleted successfully",
      })

      fetchAllAssignments()
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to delete assignment",
        variant: "destructive"
      })
    }
  }

  // Remove unused link management functions for now
  // const addLink = () => {
  //   if (newLink.title && newLink.url) {
  //     setNewAssignment({
  //       ...newAssignment,
  //       links: [...newAssignment.links, newLink]
  //     })
  //     setNewLink({ title: '', url: '', type: 'link' })
  //   }
  // }

  // const removeLink = (index: number) => {
  //   setNewAssignment({
  //     ...newAssignment,
  //     links: newAssignment.links.filter((_, i) => i !== index)
  //   })
  // }

  const startEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment)

    // Use assigned_children_details if available, otherwise fall back to assigned_children
    let assignedChildOptions: Option[] = []

    if (assignment.assigned_children_details?.length > 0) {
      // Use the detailed information that includes student IDs
      assignedChildOptions = assignment.assigned_children_details.map((child: ChildDetail) => {
        // Find parent name
        const family = families.find(f => f.parent_id === child.parent_id)
        const parentName = family?.parent_name || 'Unknown Parent'
        return {
          label: `${child.name} (${parentName})`,
          value: child.id
        }
      })
    } else {
      // Fallback to the old method using names
      assignedChildOptions = assignment.assigned_children?.map(childName => {
        // Find the child in all families
        for (const family of families) {
          const child = family.children.find(c => c.name === childName)
          if (child) {
            return { label: `${child.name} (${family.parent_name})`, value: child.id }
          }
        }
        return { label: childName, value: childName } // Fallback if child not found
      }).filter(Boolean) || []
    }

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

  // Filter assignments by selected family
  const filteredAssignments = selectedFamily === 'all'
    ? assignments
    : assignments.filter(a => {
      const family = families.find(f => f.parent_name === a.parent_name)
      return family?.parent_id === selectedFamily
    })

  // Get all children options for assignment (deduplicated by ID)
  const allChildrenOptions = Array.from(
    new Map(
      families.flatMap(family =>
        family.children.map(child => [
          child.id, // Use ID as key for deduplication
          {
            label: `${child.name} (${family.parent_name})`,
            value: child.id
          }
        ])
      )
    ).values()
  )

  console.log('Admin Debug - Current families state:', families)
  console.log('Admin Debug - Total children options generated:', allChildrenOptions.length)

  return (
    <>
      <div className="z-10 relative container mx-auto p-4 max-w-6xl">
        <div className="gap-4 flex md:flex-row flex-col justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage assignments across all families</p>
          </div>

          <Button
            className="gap-2"
            onClick={() => setIsCreating(true)}
            disabled={families.length === 0}
          >
            <Plus className="h-4 w-4" />
            Create Assignment
            {families.length === 0 && ' (Loading...)'}
          </Button>

          <AssignmentForm
            isOpen={isCreating}
            onOpenChange={setIsCreating}
            editingAssignment={editingAssignment}
            assignmentData={newAssignment}
            onAssignmentDataChange={setNewAssignment}
            onSave={createOrUpdateAssignment}
            onCancel={resetForm}
            isSaving={isSaving}
            categories={categories}
            childrenOptions={allChildrenOptions}
            selectedCalendarDate={selectedCalendarDate}
            onCalendarDateChange={setSelectedCalendarDate}
          />
        </div>

        <Tabs defaultValue="assignments" className="w-full">
          <TabsList>
            <TabsTrigger value="assignments">All Assignments</TabsTrigger>
            <TabsTrigger value="families">Families</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <Suspense fallback={<div className="flex items-center justify-center h-64">Loading assignments...</div>}>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">
                  All Assignments ({filteredAssignments.length}
                  {selectedFamily !== 'all' && ` of ${assignments.length}`})
                </h2>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      {selectedFamily === 'all'
                        ? 'All Families'
                        : families.find(f => f.parent_id === selectedFamily)?.parent_name || 'Unknown Family'
                      }
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setSelectedFamily('all')}
                      className={selectedFamily === 'all' ? 'bg-accent' : ''}
                    >
                      All Families ({assignments.length} assignments)
                    </DropdownMenuItem>
                    {families.map((family) => {
                      const familyAssignmentCount = assignments.filter(a => a.parent_name === family.parent_name).length
                      return (
                        <DropdownMenuItem
                          key={family.parent_id}
                          onClick={() => setSelectedFamily(family.parent_id)}
                          className={selectedFamily === family.parent_id ? 'bg-accent' : ''}
                        >
                          {family.parent_name} ({familyAssignmentCount} assignments)
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {assignments.length > 0 && (() => {
                // const parentBreakdown = assignments.reduce((acc, a) => {
                //   acc[a.parent_name || 'Unknown'] = (acc[a.parent_name || 'Unknown'] || 0) + 1
                //   return acc
                // }, {} as Record<string, number>)

                return null
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Users className="h-4 w-4" />
                            {assignment.parent_name}
                          </CardDescription>
                        </div>
                        <div className="hidden group-hover:flex gap-0 bg-background absolute top-2 right-2 rounded-lg">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="group-hover:text-foreground"
                            onClick={() => startEditAssignment(assignment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-red-500"
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

              {filteredAssignments.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      {selectedFamily === 'all'
                        ? 'No assignments found across all families.'
                        : `No assignments found for ${families.find(f => f.parent_id === selectedFamily)?.parent_name || 'this family'}.`
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="families" className="space-y-4">
            <Suspense fallback={<div className="flex items-center justify-center h-64">Loading families...</div>}>
              <h2 className="text-2xl font-semibold">All Families ({families.length})</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {families.map((family) => (
                  <Card key={family.parent_id}>
                    <CardHeader>
                      <CardTitle>{family.parent_name}</CardTitle>
                      <CardDescription>{family.parent_email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Children ({family.children.length}):</h4>
                        {family.children.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No children registered</p>
                        ) : (
                          <div className="space-y-1">
                            {family.children.map((child) => (
                              <div key={child.id} className="flex justify-between items-center text-sm">
                                <span>{child.name}</span>
                                <span className="text-xs text-muted-foreground">{child.email}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {families.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No families found.</p>
                  </CardContent>
                </Card>
              )}
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
      <PageGrid variant="color" />
    </>
  )
}
