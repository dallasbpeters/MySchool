'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  RadixDropdown,
  DropdownItem,
} from '@/components/ui/motion/motion-dropdown-menu'
import { Option } from '@/components/ui/multiselect'
import { AssignmentForm } from '@/components/assignment-form'
import { Plus, Filter } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PageGrid from '@/components/page-grid'
import { KanbanAssignmentBoard } from '@/components/kanban-assignment-board'
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
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null,
  )
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
      frequency: 'weekly' as 'weekly' | 'daily',
    },
    recurrence_end_date: '',
  })
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    Date | undefined
  >(new Date())
  // Temporarily comment out unused link state
  // const [newLink, setNewLink] = useState({ title: '', url: '', type: 'link' as 'link' | 'video' })
  const { toast } = useToast()

  const checkAdminAccess = useCallback(async () => {
    try {
      // Try to fetch admin assignments directly - this will verify admin role
      const response = await fetch('/api/admin/assignments')

      if (!response.ok) {
        // Handle non-2xx responses
        return
      }

      const data = await response.json()

      if (data.assignments) {
        setAssignments(data.assignments)
        await fetchAllFamilies() // Make sure families are loaded before enabling edit
        fetchCategories()
      }
    } catch (error) {
      console.error('Failed to check admin access:', error)
    } finally {
    }
  }, [])

  useEffect(() => {
    checkAdminAccess()
  }, [checkAdminAccess])

  // Note: Date synchronization is now handled in AssignmentForm component

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
        const uniqueCategories = [
          ...new Set(
            data.assignments
              .map((a: Assignment) => a.category)
              .filter((c: string) => c && c.trim()),
          ),
        ]
        setCategories(
          uniqueCategories.map((cat: string) => ({ label: cat, value: cat })),
        )
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
    }
  }

  const createOrUpdateAssignment = async () => {
    setIsSaving(true)

    // Validation
    if (!newAssignment.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an assignment title',
        variant: 'destructive',
      })
      setIsSaving(false)
      return
    }

    if (newAssignment.selectedChildren.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one student for this assignment',
        variant: 'destructive',
      })
      setIsSaving(false)
      return
    }

    if (
      newAssignment.is_recurring &&
      newAssignment.recurrence_pattern.days.length === 0
    ) {
      toast({
        title: 'Error',
        description:
          'Please select at least one day for the recurring assignment',
        variant: 'destructive',
      })
      setIsSaving(false)
      return
    }

    try {
      const isEditing = !!editingAssignment
      const url = isEditing
        ? `/api/admin/assignments?id=${editingAssignment.id}`
        : '/api/admin/assignments'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newAssignment.title,
          content: newAssignment.content,
          links: newAssignment.links,
          due_date: newAssignment.due_date,
          category:
            newAssignment.category.length > 0
              ? newAssignment.category[0].value
              : '',
          selectedChildren: newAssignment.selectedChildren.map(
            (child) => child.value,
          ),
          is_recurring: newAssignment.is_recurring,
          recurrence_pattern: newAssignment.is_recurring
            ? newAssignment.recurrence_pattern
            : null,
          recurrence_end_date:
            newAssignment.is_recurring && newAssignment.recurrence_end_date
              ? newAssignment.recurrence_end_date
              : null,
        }),
      })

      // Always read the body to inspect partial-success responses (e.g., 207)
      const data = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }))

      if (!response.ok || data?.error) {
        throw new Error(
          data?.error ||
            `Assignment ${isEditing ? 'update' : 'creation'} failed`,
        )
      }

      // Success!
      toast({
        title: 'Success',
        description:
          data.message ||
          `Assignment ${isEditing ? 'updated' : 'created'} successfully`,
      })

      resetForm()
      fetchAllAssignments()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description:
          (error as Error).message ||
          `An unexpected error occurred while ${editingAssignment ? 'updating' : 'creating'} the assignment`,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteAssignment = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/assignments?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Delete failed')
      }

      const data = await response.json()

      toast({
        title: 'Success',
        description: data.message || 'Assignment deleted successfully',
      })

      fetchAllAssignments()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to delete assignment',
        variant: 'destructive',
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
      assignedChildOptions = assignment.assigned_children_details.map(
        (child: ChildDetail) => {
          // Find parent name
          const family = families.find((f) => f.parent_id === child.parent_id)
          const parentName = family?.parent_name || 'Unknown Parent'
          return {
            label: `${child.name} (${parentName})`,
            value: child.id,
          }
        },
      )
    } else {
      // Fallback to the old method using names
      assignedChildOptions =
        assignment.assigned_children
          ?.map((childName) => {
            // Find the child in all families
            for (const family of families) {
              const child = family.children.find((c) => c.name === childName)
              if (child) {
                return {
                  label: `${child.name} (${family.parent_name})`,
                  value: child.id,
                }
              }
            }
            return { label: childName, value: childName } // Fallback if child not found
          })
          .filter(Boolean) || []
    }

    // Deduplicate assignedChildOptions by value to prevent duplicate keys
    assignedChildOptions = assignedChildOptions.filter(
      (option, index, array) =>
        array.findIndex((o) => o.value === option.value) === index,
    )

    // Convert category string to Option array
    const categoryOptions = assignment.category
      ? [{ label: assignment.category, value: assignment.category }]
      : []

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
        frequency: assignment.recurrence_pattern?.frequency || 'weekly',
      },
      recurrence_end_date: assignment.recurrence_end_date || '',
    })

    // Set the calendar date to match the assignment's due date
    // Use parseISO to properly handle the date string from the database
    setSelectedCalendarDate(parseISO(assignment.due_date))

    setIsCreating(true)
  }

  const resetForm = () => {
    setEditingAssignment(null)
    const today = new Date()
    setNewAssignment({
      title: '',
      content: null,
      links: [] as Link[],
      due_date: format(today, 'yyyy-MM-dd'),
      category: [] as Option[],
      selectedChildren: [] as Option[],
      is_recurring: false,
      recurrence_pattern: {
        days: [] as string[],
        frequency: 'weekly' as 'weekly' | 'daily',
      },
      recurrence_end_date: '',
    })
    // Reset calendar to today when creating new assignment
    setSelectedCalendarDate(today)
    setIsCreating(false)
  }

  // Filter assignments by selected family
  const filteredAssignments = useMemo(
    () =>
      selectedFamily === 'all'
        ? assignments
        : assignments.filter((a) => {
            const family = families.find((f) => f.parent_name === a.parent_name)
            return family?.parent_id === selectedFamily
          }),
    [selectedFamily, assignments, families],
  )

  // Kanban board handlers
  const handleKanbanAssignmentUpdate = (assignment: Assignment) => {
    // Open the edit form instead of updating directly
    startEditAssignment(assignment)
  }

  const handleKanbanAssignmentDragUpdate = async (assignment: Assignment) => {
    // Handle category updates from drag & drop in kanban
    try {
      const response = await fetch(
        `/api/admin/assignments?id=${assignment.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: assignment.title,
            content: assignment.content,
            links: assignment.links,
            due_date: assignment.due_date,
            category: assignment.category,
            selectedChildren: assignment.assigned_children || [],
            is_recurring: assignment.is_recurring,
            recurrence_pattern: assignment.is_recurring
              ? assignment.recurrence_pattern
              : null,
            recurrence_end_date:
              assignment.is_recurring && assignment.recurrence_end_date
                ? assignment.recurrence_end_date
                : null,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Update failed')
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Assignment category updated',
        })
        fetchAllAssignments()
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to update assignment',
        variant: 'destructive',
      })
    }
  }

  const handleKanbanCreateAssignment = (category: string) => {
    // Clear any existing edit state first
    setEditingAssignment(null)

    // Pre-populate the category and open the create form
    const categoryOptions =
      category !== 'Uncategorized' ? [{ label: category, value: category }] : []

    setNewAssignment((prev) => ({
      ...prev,
      category: categoryOptions,
    }))
    setIsCreating(true)
  }

  // Get all children options for assignment (deduplicated by ID)
  const allChildrenOptions = Array.from(
    new Map(
      families.flatMap((family) =>
        family.children.map((child) => [
          child.id, // Use ID as key for deduplication
          {
            label: `${child.name} (${family.parent_name})`,
            value: child.id,
          },
        ]),
      ),
    ).values(),
  ).filter(
    (option, index, array) =>
      // Additional safety check to ensure no duplicates
      array.findIndex((o) => o.value === option.value) === index,
  )

  return (
    <>
      <div className="z-5 relative mx-auto p-4 ">
        <Tabs defaultValue="assignments" className=" w-auto self-start">
          <div className="gap-4 flex md:flex-row flex-col justify-start items-start md:items-center mb-6 z-20">
            <TabsList className="inline-flex self-start w-auto">
              <TabsTrigger value="assignments">All Assignments</TabsTrigger>
              <TabsTrigger value="families">Families</TabsTrigger>
            </TabsList>
            <Button
              className="gap-2"
              onClick={() => {
                setEditingAssignment(null)
                setIsCreating(true)
              }}
              disabled={families.length === 0}
            >
              <Plus className="h-4 w-4" />
              Create Assignment
              {families.length === 0 && ' (Loading...)'}
            </Button>
            <RadixDropdown
              triggerText={
                <>
                  <Filter className="h-4 w-4" />
                  {selectedFamily === 'all'
                    ? 'All Families '
                    : families.find((f) => f.parent_id === selectedFamily)
                        ?.parent_name || 'Unknown Family '}
                  ▾
                </>
              }
            >
              <DropdownItem
                onClick={() => setSelectedFamily('all')}
                className={
                  selectedFamily === 'all'
                    ? 'bg-accent text-accent-foreground'
                    : ''
                }
              >
                All Families ({assignments.length} assignments)
              </DropdownItem>
              {families.map((family) => {
                const familyAssignmentCount = assignments.filter(
                  (a) => a.parent_name === family.parent_name,
                ).length
                return (
                  <DropdownItem
                    key={family.parent_id}
                    onClick={() => setSelectedFamily(family.parent_id)}
                    className={
                      selectedFamily === family.parent_id
                        ? 'bg-accent text-accent-foreground'
                        : ''
                    }
                  >
                    {family.parent_name} ({familyAssignmentCount} assignments)
                  </DropdownItem>
                )
              })}
            </RadixDropdown>
          </div>

          <TabsContent value="assignments" className="space-y-4 z-10">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  Loading assignments...
                </div>
              }
            >
              {assignments.length > 0 &&
                (() => {
                  // const parentBreakdown = assignments.reduce((acc, a) => {
                  //   acc[a.parent_name || 'Unknown'] = (acc[a.parent_name || 'Unknown'] || 0) + 1
                  //   return acc
                  // }, {} as Record<string, number>)

                  return null
                })()}

              <KanbanAssignmentBoard
                assignments={filteredAssignments}
                categories={useMemo(
                  () =>
                    Array.from(
                      new Set(
                        filteredAssignments
                          .map((a) => a.category)
                          .filter(Boolean),
                      ),
                    ),
                  [filteredAssignments],
                )}
                onAssignmentUpdate={handleKanbanAssignmentUpdate}
                onAssignmentDelete={deleteAssignment}
                onCreateAssignment={handleKanbanCreateAssignment}
                onAssignmentDragUpdate={handleKanbanAssignmentDragUpdate}
                userRole="admin"
              />

              {filteredAssignments.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      {selectedFamily === 'all'
                        ? 'No assignments found across all families.'
                        : `No assignments found for ${families.find((f) => f.parent_id === selectedFamily)?.parent_name || 'this family'}.`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="families" className="space-y-4">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  Loading families...
                </div>
              }
            >
              <h2 className="text-2xl font-semibold">
                All Families ({families.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {families.map((family) => (
                  <Card key={family.parent_id}>
                    <CardHeader>
                      <CardTitle>{family.parent_name}</CardTitle>
                      <CardDescription>{family.parent_email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">
                          Children ({family.children.length}):
                        </h4>
                        {family.children.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No children registered
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {family.children.map((child) => (
                              <div
                                key={child.id}
                                className="flex justify-between items-center text-sm"
                              >
                                <span>{child.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {child.email}
                                </span>
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
        onCalendarDateChange={(date) => {
          setSelectedCalendarDate(date)
          // Also update the assignment data's due_date when calendar date changes
          if (date) {
            const formattedDate = format(date, 'yyyy-MM-dd')
            setNewAssignment((prev) => ({
              ...prev,
              due_date: formattedDate,
            }))
          }
        }}
      />
      <PageGrid variant="gradient" />
    </>
  )
}
