'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AssignmentService } from '@/services/assignment-service'
import { Assignment } from '@/types'

export default function DebugPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const fetchAndAnalyzeAssignments = async () => {
    try {
      const response = await fetch('/api/assignments')

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        setDebugInfo({
          error: `API Error ${response.status}: ${errorText}`,
          totalAssignments: 0
        })
        return
      }

      const data = await response.json()

      if (data.assignments) {
        setAssignments(data.assignments)

        // Analyze the assignments
        const groups = AssignmentService.groupAssignments(data.assignments)
        const today = new Date().toISOString().split('T')[0]

        // Count recurring assignments
        const recurringCount = data.assignments.filter((a: Assignment) => a.is_recurring).length
        const nonRecurringCount = data.assignments.length - recurringCount

        const analysis = {
          totalAssignments: data.assignments.length,
          recurringAssignments: recurringCount,
          nonRecurringAssignments: nonRecurringCount,
          todayDate: today,
          todayJS: new Date().toISOString(),
          rawAssignments: data.assignments.map((a: Assignment) => {
            const todayParsed = new Date()
            todayParsed.setHours(0, 0, 0, 0)
            const dueDateParsed = new Date(a.due_date)
            dueDateParsed.setHours(0, 0, 0, 0)

            return {
              id: a.id,
              title: a.title,
              due_date: a.due_date,
              due_date_parsed: dueDateParsed.toISOString(),
              completed: a.completed,
              daysDifference: Math.floor((dueDateParsed.getTime() - todayParsed.getTime()) / (1000 * 60 * 60 * 24)),
              isOverdue: AssignmentService.filters.isOverdue(a),
              isToday: AssignmentService.filters.isToday(a),
              isUpcoming: AssignmentService.filters.isUpcoming(a),
              isPast: AssignmentService.filters.isPast(a),
              // Recurring assignment info
              is_recurring: a.is_recurring || false,
              recurrence_pattern: a.recurrence_pattern || null,
              recurrence_end_date: a.recurrence_end_date || null,
              next_due_date: a.next_due_date || null,
              instance_completions: a.instance_completions || {},
              instance_completions_count: Object.keys(a.instance_completions || {}).length
            }
          }),
          groups: {
            overdue: groups.overdue.length,
            today: groups.today.length,
            upcoming: groups.upcoming.length,
            past: groups.past.length
          },
          groupDetails: {
            overdue: groups.overdue.map(a => ({ id: a.id, title: a.title, due_date: a.due_date, completed: a.completed })),
            today: groups.today.map(a => ({ id: a.id, title: a.title, due_date: a.due_date, completed: a.completed })),
            upcoming: groups.upcoming.map(a => ({ id: a.id, title: a.title, due_date: a.due_date, completed: a.completed })),
            past: groups.past.map(a => ({ id: a.id, title: a.title, due_date: a.due_date, completed: a.completed }))
          }
        }

        setDebugInfo(analysis)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  useEffect(() => {
    fetchAndAnalyzeAssignments()
  }, [])

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Assignment Debug Information</CardTitle>
          <Button onClick={fetchAndAnalyzeAssignments}>
            Refresh Data
          </Button>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex items-center justify-center h-32">Loading debug data...</div>}>
            {debugInfo && (
              <div className="space-y-4">
                {debugInfo.error ? (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <h3 className="font-semibold">Error</h3>
                    <p>{debugInfo.error}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="font-semibold">Summary</h3>
                      <p>Total Assignments: {debugInfo.totalAssignments}</p>
                      <p>Recurring Assignments: {debugInfo.recurringAssignments || 0}</p>
                      <p>Non-Recurring Assignments: {debugInfo.nonRecurringAssignments || 0}</p>
                      <p>Today's Date: {debugInfo.todayDate}</p>
                      <hr className="my-2" />
                      <p>Overdue: {debugInfo.groups?.overdue || 0}</p>
                      <p>Today: {debugInfo.groups?.today || 0}</p>
                      <p>Upcoming: {debugInfo.groups?.upcoming || 0}</p>
                      <p>Past: {debugInfo.groups?.past || 0}</p>
                    </div>
                  </>
                )}
                {debugInfo.rawAssignments && (
                  <>
                    <div>
                      <h3 className="font-semibold">Raw Assignment Analysis</h3>
                      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                        {JSON.stringify(debugInfo.rawAssignments, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <h3 className="font-semibold">Group Details</h3>
                      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                        {JSON.stringify(debugInfo.groupDetails, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
