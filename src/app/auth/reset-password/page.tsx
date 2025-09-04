'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true

    const setupPasswordReset = async () => {


      try {
        const supabase = createClient()

        // Check if we already have a valid session
        const { data: { session } } = await supabase.auth.getSession()


        if (session?.user) {
          // Already have a session - ready for password reset

          if (mounted) {
            setIsValidSession(true)
            setIsCheckingSession(false)
            // Clear URL parameters for cleaner experience
            window.history.replaceState({}, '', '/auth/reset-password')
          }
          return
        }

        // Check for reset code in URL
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')
        const errorCode = urlParams.get('error_code')



        // Handle error states first
        if (error || errorCode) {

          if (mounted) {
            setIsValidSession(false)
            setIsCheckingSession(false)
          }
          return
        }

        // Exchange code for session if we have one
        if (code) {

          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {

            if (mounted) {
              setIsValidSession(false)
              setIsCheckingSession(false)
            }
          } else {

            // Wait for auth state change event or check session again
            const { data: { session: newSession } } = await supabase.auth.getSession()
            if (newSession?.user && mounted) {
              setIsValidSession(true)
              setIsCheckingSession(false)
              // Clear URL for cleaner experience
              window.history.replaceState({}, '', '/auth/reset-password')
            }
          }
        } else {
          // No code and no session - invalid access

          if (mounted) {
            setIsValidSession(false)
            setIsCheckingSession(false)
          }
        }
      } catch (error) {

        if (mounted) {
          setIsValidSession(false)
          setIsCheckingSession(false)
        }
      }
    }

    // Listen for auth events
    const supabase = createClient()
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (session?.user && mounted) {
          setIsValidSession(true)
          setIsCheckingSession(false)
        }
      }
    })

    setupPasswordReset()

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive"
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Request timed out. Please try again.",
        variant: "destructive"
      })
    }, 10000) // 10 second timeout

    try {


      // Use our API route which handles the Supabase call server-side
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: password
        })
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password')
      }


      toast({
        title: "Success",
        description: "Password updated successfully! Redirecting to login..."
      })

      // Clear form
      setPassword('')
      setConfirmPassword('')

      // Redirect immediately without waiting for signOut

      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)

      // Sign out in background (don't await it)
      const supabase = createClient()
      supabase.auth.signOut().catch(() => {
        // Ignore signout errors since we're already redirecting
      })

    } catch (error: unknown) {
      console.error('Reset password error:', error)
      clearTimeout(timeoutId)

      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
        <Card className="mx-auto w-500 max-w-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidSession) {
    const urlParams = new URLSearchParams(window.location.search)
    const errorCode = urlParams.get('error_code')
    const errorDescription = urlParams.get('error_description')

    return (
      <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
        <Card className="mx-auto w-500 max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl">
              {errorCode === 'otp_expired' ? 'Reset Link Expired' : 'Invalid Reset Link'}
            </CardTitle>
            <CardDescription>
              {errorDescription || 'This password reset link is invalid or has expired. Please request a new one.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Back to Login
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Reset links expire after 1 hour for security reasons.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
      <Card className="mx-auto min-w-lg max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
