'use client'

import { use } from 'react'
import { ClientContainer } from "@/calendar/components/client-container"
import { notFound } from 'next/navigation'

interface CalendarViewPageProps {
  params: Promise<{
    view: string
  }>
}

const validViews = ['day-view', 'week-view', 'month-view', 'year-view', 'agenda-view']

export default function CalendarViewPage({ params }: CalendarViewPageProps) {
  const { view } = use(params)

  // Validate the view parameter
  if (!validViews.includes(view)) {
    notFound()
  }

  // Convert URL format to component format
  const viewType = view.replace('-view', '') as 'day' | 'week' | 'month' | 'year' | 'agenda'

  return (
    <div className="relative z-10 mx-auto flex max-w-screen-2xl flex-col gap-4 p-4">
      <ClientContainer view={viewType} />
    </div>
  )
}


