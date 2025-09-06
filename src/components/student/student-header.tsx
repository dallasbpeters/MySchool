'use client'

import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  childrenList: Child[]
  onChildSelect: (childId: string, childName: string) => void
}

export function StudentHeader({
  userRole,
  selectedChildId,
  selectedChildName,
  childrenList,
  onChildSelect,
}: StudentHeaderProps) {
  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {childrenList.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="text-xl min-w-[200px] justify-between"
                >
                  {selectedChildName ||
                    (userRole === 'admin'
                      ? 'Select a student'
                      : 'Select a child')}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[200px]">
                {childrenList.map((child) => (
                  <DropdownMenuItem
                    key={child.id}
                    onClick={() => onChildSelect(child.id, child.name)}
                    className={selectedChildId === child.id ? 'bg-muted' : ''}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{child.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {child.email}
                      </span>
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
