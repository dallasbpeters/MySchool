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
  const [hasProcessedCode, setHasProcessedCode] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const handlePasswordReset = async () => {
      try {
        // First check if we already have a session (from a previous code exchange)
        const { data: { session } } = await supabase.auth.getSession()
        
        // If we have a session and it's a recovery session, we're good
        if (session?.user) {
          console.log('Existing session found:', session.user.email)
          if (mounted) {
            setIsValidSession(true)
            setIsCheckingSession(false)
          }
          return
        }

        // Check for recovery parameters in URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const urlParams = new URLSearchParams(window.location.search)
        
        // Check both hash and query params (Supabase can use either)
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type') || urlParams.get('type')
        const code = urlParams.get('code')
        
        console.log('Reset params:', { accessToken, type, code, hash: window.location.hash, search: window.location.search })

        // Check for error in URL (expired or invalid link)
        const error = urlParams.get('error')
        const errorCode = urlParams.get('error_code')
        const errorDescription = urlParams.get('error_description')
        
        if (error || errorCode) {
          console.error('Reset link error:', error, errorCode, errorDescription)
          if (mounted) {
            setIsValidSession(false)
            setIsCheckingSession(false)
          }
          return
        }

        // Check if this is a recovery link
        if (code && !hasProcessedCode) {
          // PKCE flow with code - most common case for password reset
          console.log('Exchanging code for session...')
          setHasProcessedCode(true) // Prevent multiple exchanges
          
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            if (mounted) {
              setIsValidSession(false)
              
              // Clear the URL to remove the used code
              window.history.replaceState({}, '', '/auth/reset-password')
            }
          } else {
            console.log('Recovery session established via code exchange')
            if (mounted) {
              setIsValidSession(true)
              
              // Clear the URL to remove the used code
              window.history.replaceState({}, '', '/auth/reset-password')
            }
          }
        } else if (type === 'recovery' && accessToken) {
          // Direct token in hash (implicit flow - older method)
          console.log('Recovery link with access token detected')
          if (mounted) {
            setIsValidSession(true)
          }
        } else if (!code) {
          // No valid recovery params
          console.log('No valid recovery parameters found')
          if (mounted) {
            setIsValidSession(false)
          }
        }
      } catch (error) {
        console.error('Password reset check error:', error)
        if (mounted) {
          setIsValidSession(false)
        }
      } finally {
        if (mounted) {
          setIsCheckingSession(false)
        }
      }
    }

    // Set up auth state listener specifically for PASSWORD_RECOVERY event
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      // Only handle PASSWORD_RECOVERY event on this page
      if (event === 'PASSWORD_RECOVERY' && mounted) {
        console.log('PASSWORD_RECOVERY event detected')
        setIsValidSession(true)
        setIsCheckingSession(false)
      }
    })

    // Check for recovery params immediately
    handlePasswordReset()

    // Cleanup
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

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Password updated successfully"
      })

      // Redirect to home
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
