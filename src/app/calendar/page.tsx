'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ColourfulText from '@/components/ui/colourful-text'

export default function CalendarPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to default month view
    router.replace('/calendar/week-view')
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <ColourfulText text="Redirecting to calendar..." />
    </div>
  )
}
