'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function FixRolePage() {
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkCurrentUser()
  }, [])

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUserId(user.id)

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, email, name')
      .eq('id', user.id)
      .single()

    console.log('Current profile:', profile)
    console.log('Error fetching profile:', error)

    if (profile) {
      setCurrentRole(profile.role)
    }
    setLoading(false)
  }

  const updateRole = async (newRole: 'parent' | 'student') => {
    if (!userId) return

    setUpdating(true)
    
    try {
      const response = await fetch('/api/fix-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole })
      })

      const result = await response.json()
      console.log('Update result:', result)

      if (response.ok) {
        setCurrentRole(newRole)
        alert(`Role updated to ${newRole}! Redirecting...`)
        setTimeout(() => {
          router.push('/')
        }, 1000)
      } else {
        alert('Failed to update role: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update role')
    }
    
    setUpdating(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Fix User Role</CardTitle>
          <CardDescription>
            Update your account role to access the correct dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Current Role:</strong> {currentRole || 'Not set'}
            </p>
            <p className="text-sm mt-1">
              <strong>User ID:</strong> {userId}
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => updateRole('parent')}
              disabled={updating || currentRole === 'parent'}
              className="w-full"
            >
              {updating ? 'Updating...' : 'Set as Parent'}
            </Button>
            <Button
              onClick={() => updateRole('student')}
              disabled={updating || currentRole === 'student'}
              variant="outline"
              className="w-full"
            >
              {updating ? 'Updating...' : 'Set as Student'}
            </Button>
          </div>

          {currentRole && (
            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}