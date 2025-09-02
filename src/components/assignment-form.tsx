'use client'

import { useState, useEffect } from 'react'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import MultipleSelector, { Option } from '@/components/ui/multiselect'
import { Plus, Trash2, Calendar, Link as LinkIcon, Repeat, Video, ExternalLink, Play } from 'lucide-react'
import { format } from 'date-fns'
import { MiniCalendar, MiniCalendarNavigation, MiniCalendarDays, MiniCalendarDay } from '@/components/ui/shadcn-io/mini-calendar'

interface Link {
  title: string
  url: string
  type?: 'link' | 'video'
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
    days: string[]
    frequency?: 'weekly' | 'daily'
  }
  recurrence_end_date?: string
  next_due_date?: string
  assigned_children?: string[]
}

interface AssignmentFormData {
  title: string
  content: any
  links: Link[]
  due_date: string
  category: Option[]
  selectedChildren: Option[]
  is_recurring: boolean
  recurrence_pattern: {
    days: string[]
    frequency: 'weekly' | 'daily'
  }
  recurrence_end_date: string
}

interface AssignmentFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingAssignment: Assignment | null
  assignmentData: AssignmentFormData
  onAssignmentDataChange: (data: AssignmentFormData) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  categories: Option[]
  childrenOptions: Option[]
  selectedCalendarDate: Date | undefined
  onCalendarDateChange: (date: Date | undefined) => void
}

export function AssignmentForm({
  isOpen,
  onOpenChange,
  editingAssignment,
  assignmentData,
  onAssignmentDataChange,
  onSave,
  onCancel,
  isSaving,
  categories,
  childrenOptions,
  selectedCalendarDate,
  onCalendarDateChange
}: AssignmentFormProps) {
  const [newLink, setNewLink] = useState({ title: '', url: '', type: 'link' as 'link' | 'video' })

  const addLink = () => {
    if (newLink.title && newLink.url) {
      onAssignmentDataChange({
        ...assignmentData,
        links: [...assignmentData.links, newLink]
      })
      setNewLink({ title: '', url: '', type: 'link' })
    }
  }

  const removeLink = (index: number) => {
    onAssignmentDataChange({
      ...assignmentData,
      links: assignmentData.links.filter((_, i) => i !== index)
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
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
              value={assignmentData.title}
              onChange={(e) => onAssignmentDataChange({
                ...assignmentData,
                title: e.target.value
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <MultipleSelector
              value={assignmentData.category}
              onChange={(selected) => onAssignmentDataChange({
                ...assignmentData,
                category: selected
              })}
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
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${!assignmentData.is_recurring
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                    }`}
                  onClick={() => onAssignmentDataChange({
                    ...assignmentData,
                    is_recurring: false
                  })}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium text-sm">One-time Assignment</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Has a specific due date</p>
                </div>

                <div
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${assignmentData.is_recurring
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                    }`}
                  onClick={() => onAssignmentDataChange({
                    ...assignmentData,
                    is_recurring: true
                  })}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat className="h-4 w-4" />
                    <span className="font-medium text-sm">Recurring Assignment</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Repeats on selected days</p>
                </div>
              </div>
            </div>

            {!assignmentData.is_recurring && (
              <div className="space-y-2">
                <Label className="text-sm text-foreground mb-1 block">Due Date</Label>
                <MiniCalendar
                  value={selectedCalendarDate}
                  onValueChange={onCalendarDateChange}
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

          {assignmentData.is_recurring && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label className="text-sm text-foreground mb-1 block">Start Date</Label>
                <MiniCalendar
                  value={selectedCalendarDate}
                  onValueChange={onCalendarDateChange}
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
                      const isSelected = assignmentData.recurrence_pattern.days.includes(day)
                      return (
                        <Button
                          key={day}
                          type="button"
                          onClick={() => {
                            const updatedDays = assignmentData.recurrence_pattern.days.includes(day)
                              ? assignmentData.recurrence_pattern.days.filter(d => d !== day)
                              : [...assignmentData.recurrence_pattern.days, day]

                            onAssignmentDataChange({
                              ...assignmentData,
                              recurrence_pattern: {
                                ...assignmentData.recurrence_pattern,
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
                  value={assignmentData.recurrence_end_date}
                  onChange={(e) => onAssignmentDataChange({
                    ...assignmentData,
                    recurrence_end_date: e.target.value
                  })}
                  min={assignmentData.due_date}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Assignment Content</Label>
            <WysiwygEditor
              content={assignmentData.content}
              onChange={(content) => onAssignmentDataChange({
                ...assignmentData,
                content
              })}
              placeholder="Type your assignment instructions here..."
            />
          </div>

          <div className="space-y-2 mt-4">
            <Label>Assign to Children</Label>
            {childrenOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No children available for assignment.
              </p>
            ) : (
              <MultipleSelector
                value={assignmentData.selectedChildren}
                onChange={(selected) => onAssignmentDataChange({
                  ...assignmentData,
                  selectedChildren: selected
                })}
                options={childrenOptions}
                placeholder="Select children to assign..."
              />
            )}
          </div>

          <div className="space-y-2 mt-4">
            <Label>Links & Resources</Label>
            <div className="space-y-2">
              {assignmentData.links.map((link, index) => (
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
                  <div className="flex items-center gap-2">
                    {link.type === 'video' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(link.url, '_blank')
                        }}
                        className="text-xs"
                      >
                        <Play className="h-3 w-3" />
                        Preview
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(link.url, '_blank')
                        }}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLink(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : (editingAssignment ? 'Update Assignment' : 'Save Assignment')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
