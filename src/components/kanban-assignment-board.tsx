'use client'

import React, { useMemo } from 'react'
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from '@/components/ui/shadcn-io/kanban'
import { Button } from '@/components/ui/button'
import { Plus, Repeat, Edit, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type KanbanItemProps = {
  id: string
  name: string
  column: string
} & Record<string, unknown>

interface Assignment {
  id: string
  title: string
  content: string | null
  links: Array<{ title: string; url: string; type?: 'link' | 'video' }>
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
  parent_name?: string
}

interface Recommendation {
  id: string
  title: string
  content?: string
  category?: string
  links?: Array<{ title: string; url: string; type?: 'link' | 'video' }>
  created_at: string
  updated_at: string
  created_by: string
  parent_name?: string
}

interface KanbanAssignmentBoardProps {
  assignments: Assignment[]
  recommendations?: Recommendation[]
  categories: string[]
  onAssignmentUpdate: (assignment: Assignment) => void
  onAssignmentDelete: (assignmentId: string) => void
  onCreateAssignment: (category: string) => void
  onAssignmentDragUpdate?: (assignment: Assignment) => void
  onRecommendationUpdate?: (recommendation: Recommendation) => void
  onRecommendationDelete?: (recommendationId: string) => void
  userRole?: string
}

type AssignmentKanbanItem = KanbanItemProps & {
  assignment: Assignment
}

type RecommendationKanbanItem = KanbanItemProps & {
  recommendation: Recommendation
}

type KanbanItem = AssignmentKanbanItem | RecommendationKanbanItem

export function KanbanAssignmentBoard({
  assignments,
  recommendations = [],
  categories,
  onAssignmentUpdate,
  onAssignmentDelete,
  onCreateAssignment,
  onAssignmentDragUpdate,
  onRecommendationUpdate,
  onRecommendationDelete,
  userRole = 'parent',
}: KanbanAssignmentBoardProps) {
  // Transform assignments and recommendations into kanban data
  const kanbanData = React.useMemo(() => {
    const assignmentItems = assignments.map((assignment) => ({
      id: assignment.id,
      name: assignment.title,
      column: assignment.category || 'Uncategorized',
      assignment,
    }))

    const recommendationItems = recommendations.map((recommendation) => ({
      id: `rec-${recommendation.id}`,
      name: recommendation.title,
      column: 'Recommendations',
      recommendation,
    }))

    return [...assignmentItems, ...recommendationItems]
  }, [assignments, recommendations])

  // Create columns from categories plus Recommendations
  const kanbanColumns = useMemo(() => {
    const allCategories = [...new Set([...categories, 'Uncategorized'])]
    const categoryColumns = allCategories.map((category) => ({
      id: category,
      name: category,
    }))

    // Add Recommendations column if there are recommendations
    if (recommendations.length > 0) {
      categoryColumns.push({
        id: 'Recommendations',
        name: 'Recommendations',
      })
    }

    return categoryColumns
  }, [categories, recommendations])

  const handleDataChange = React.useCallback(
    (newData: KanbanItem[]) => {
      // Update assignment categories based on new column positions (only for assignments, not recommendations)
      newData.forEach((item) => {
        if (
          'assignment' in item &&
          item.assignment &&
          typeof item.assignment === 'object' &&
          item.assignment !== null &&
          'category' in item.assignment &&
          item.assignment.category !== item.column &&
          item.column !== 'Recommendations'
        ) {
          const assignment = item.assignment as Assignment
          const updatedAssignment = {
            ...assignment,
            category: item.column === 'Uncategorized' ? undefined : item.column,
          }
          // Use drag update handler if available, otherwise fall back to regular update
          if (onAssignmentDragUpdate) {
            onAssignmentDragUpdate(updatedAssignment)
          } else {
            onAssignmentUpdate(updatedAssignment)
          }
        }
      })
    },
    [onAssignmentDragUpdate, onAssignmentUpdate],
  )

  function removeLastName(parentName) {
    const nameParts = parentName.trim().split(' ')
    return nameParts[0] // Returns the first name
  }

  const renderAssignmentCard = React.useCallback(
    (item: KanbanItem) => {
      // Handle recommendations differently from assignments
      if ('recommendation' in item) {
        const recommendation = item.recommendation as Recommendation
        return (
          <KanbanCard
            column="Recommendations"
            key={recommendation.id}
            id={`rec-${recommendation.id}`}
            name={recommendation.title}
            className="group"
          >
            <CardHeader className="px-1 pb-1">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-1 text-sm w-full truncate text-ellipsis line-clamp-1">
                    <span>{recommendation.title}</span>
                  </CardTitle>
                </div>
                <div className="gap-2 absolute z-[1000002] bottom-2 right-2 hidden group-hover:flex pointer-events-auto">
                  {onRecommendationUpdate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onRecommendationUpdate(recommendation)
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  {onRecommendationDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onRecommendationDelete(recommendation.id)
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </KanbanCard>
        )
      }

      // Handle assignments
      const assignment = item.assignment as Assignment

      return (
        <KanbanCard
          column={assignment.category || 'Uncategorized'}
          key={assignment.id}
          id={assignment.id}
          name={assignment.title}
          className="group"
        >
          <CardHeader className="px-1 pb-1">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <CardTitle className="flex items-center gap-1 text-sm w-full truncate text-ellipsis line-clamp-1">
                  <span>
                    {assignment.is_recurring && (
                      <Repeat className="h-3 w-3 text-blue-500 flex-shrink-0 inline mr-1" />
                    )}
                    {assignment.title}
                  </span>
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1 text-xs">
                  {format(parseISO(assignment.due_date), 'MMM dd, yyyy')}
                  {userRole === 'admin' && assignment.parent_name && (
                    <>&nbsp;-&nbsp;{removeLastName(assignment.parent_name)}</>
                  )}
                </CardDescription>
              </div>
              <div className="gap-2 absolute z-[1000002] bottom-2 right-2 hidden group-hover:flex pointer-events-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onAssignmentUpdate(assignment)
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onAssignmentDelete(assignment.id)
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {assignment.assigned_children &&
            assignment.assigned_children.length > 0 && (
              <CardContent className="pt-0 px-1">
                <div className="space-y-1 flex flex-col items-start gap-2">
                  <div className="flex flex-wrap gap-1">
                    {assignment.assigned_children.map((childName, index) => (
                      <span
                        key={index}
                        className="even:bg-blue-100 even:dark:bg-blue-900 odd:bg-yellow-100 odd:dark:bg-yellow-900 text-foreground text-xs px-2 py-0.5 rounded-full leading-4"
                      >
                        {childName}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
        </KanbanCard>
      )
    },
    [
      userRole,
      onAssignmentUpdate,
      onAssignmentDelete,
      onRecommendationUpdate,
      onRecommendationDelete,
    ],
  )

  // Create a stable children function for KanbanCards
  const kanbanCardsChildren = React.useCallback(
    (item: KanbanItem) => renderAssignmentCard(item),
    [renderAssignmentCard],
  )

  const renderColumn = React.useCallback(
    (column: { id: string; name: string }) => (
      <KanbanBoard
        key={column.id}
        id={column.id}
        className="w-full min-w-[200px]"
      >
        <KanbanHeader>
          <div className="flex items-center justify-between">
            <span>{column.name}</span>
            {column.id !== 'Recommendations' && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer h-6 w-6 p-0"
                onClick={() => onCreateAssignment(column.id)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </KanbanHeader>
        <KanbanCards id={column.id}>{kanbanCardsChildren}</KanbanCards>
      </KanbanBoard>
    ),
    [onCreateAssignment, kanbanCardsChildren],
  )

  // Create a stable children function for KanbanProvider
  const kanbanProviderChildren = React.useCallback(
    (column: { id: string; name: string }) => renderColumn(column),
    [renderColumn],
  )

  return (
    <div className="w-full bg-card border-1 border-border rounded-md shadow-sm p-3 overflow-x-auto">
      <KanbanProvider
        columns={kanbanColumns}
        data={kanbanData}
        onDataChange={handleDataChange}
      >
        {kanbanProviderChildren}
      </KanbanProvider>
    </div>
  )
}
