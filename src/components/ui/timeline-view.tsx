'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TimelineProps {
  children: ReactNode
  className?: string
}

interface TimelineItemProps {
  children: ReactNode
  className?: string
  dotColor?: 'default' | 'red' | 'blue' | 'green'
}

interface TimelineHeaderProps {
  children: ReactNode
  className?: string
  textColor?: 'default' | 'red' | 'blue' | 'green'
}

interface TimelineContentProps {
  children: ReactNode
  className?: string
}

export const Timeline = ({ children, className }: TimelineProps) => (
  <ol className={cn(" md:border-l-1 relative before:hidden md:before:block before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-grey-200 dark:before:bg-gray-400", className)}>
    {children}
  </ol>
)

export const TimelineItem = ({ children, className, dotColor = 'default' }: TimelineItemProps) => {
  const dotColors = {
    default: 'bg-gray-200 border-gray-200 dark:border-gray-900 dark:bg-gray-700',
    red: 'bg-red-500 border-red-500 dark:border-red-500 dark:bg-red-500',
    blue: 'bg-blue-500 border-blue-500 dark:border-blue-500 dark:bg-blue-500',
    green: 'bg-green-500 border-green-500 dark:border-green-500 dark:bg-green-500'
  }

  return (
    <li className={cn("mb-10 md:ml-4", className)}>
      <div className={cn(
        "hidden md:block absolute w-3 h-3 rounded-full mt-0.5 -left-1.5 border-none md:border",
        dotColors[dotColor]
      )}></div>
      {children}
    </li>
  )
}

export const TimelineHeader = ({ children, className, textColor = 'default' }: TimelineHeaderProps) => {
  const textColors = {
    default: 'text-foreground dark:text-foreground',
    red: 'text-red-500 dark:text-red-500',
    blue: 'text-blue-500 dark:text-blue-500',
    green: 'text-green-500 dark:text-green-500'
  }

  return (
    <time className={cn(
      "block mb-2 text-lg font-medium leading-none",
      textColors[textColor],
      className
    )}>
      {children}
    </time>
  )
}

export const TimelineContent = ({ children, className }: TimelineContentProps) => (
  <div className={cn("mb-6", className)}>
    {children}
  </div>
)
