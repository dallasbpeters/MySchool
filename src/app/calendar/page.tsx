'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CalendarPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to default month view
    router.replace('/calendar/week-view')
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Redirecting to calendar...</p>
    </div>
  )
}
