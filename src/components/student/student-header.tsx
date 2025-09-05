'use client'

import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

interface Child {
  id: string
  name: string
  email: string
}

interface StudentHeaderProps {
  userRole: string
  selectedChildId: string | null
  selectedChildName: string | null
  children: Child[]
  onChildSelect: (childId: string, childName: string) => void
}

export function StudentHeader({
  userRole,
  selectedChildId,
  selectedChildName,
  children,
  onChildSelect
}: StudentHeaderProps) {
  if (userRole !== 'parent' && userRole !== 'admin') {
    return (
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Assignments</h1>
        <p className="text-muted-foreground">Keep track of your homework and projects</p>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div className="flex items-center gap-4">
          {children.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-xl min-w-[200px] justify-between">
                  {selectedChildName || (userRole === 'admin' ? 'Select a student' : 'Select a child')}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[200px]">
                {children.map((child) => (
                  <DropdownMenuItem
                    key={child.id}
                    onClick={() => onChildSelect(child.id, child.name)}
                    className={selectedChildId === child.id ? 'bg-muted' : ''}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{child.name}</span>
                      <span className="text-sm text-muted-foreground">{child.email}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}
