'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchClient } from '@/lib/supabase/fetch-client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from '@/hooks/use-toast'

interface LoginFormProps extends React.ComponentPropsWithoutRef<"form"> {
  mode?: 'login' | 'signup'
}

export function LoginForm({
  className,
  mode = 'login',
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [signupCode, setSignupCode] = useState('')
  const [role, setRole] = useState<'parent' | 'student'>('parent')
  const [isLoading, setIsLoading] = useState(false)
  const [currentMode, setCurrentMode] = useState(mode)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (currentMode === 'login') {
        // Use API route instead of client method
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Login failed')
        }

        toast({
          title: "Success",
          description: "Logged in successfully",
        })

        // Redirect immediately - the server-side login worked
        window.location.href = '/'

        // Set session in background (don't await it)
        if (data.session) {
          supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          }).catch(() => {
            // Ignore errors - we're already redirecting
          })
        }
      } else {
        // Handle signup
        // If role is student, validate signup code
        if (role === 'student') {
          if (!signupCode.trim()) {
            throw new Error('Signup code is required for students')
          }

          // Use working fetch client to validate signup code
          const { data: codes, error: codeError } = await fetchClient.query(
            'signup_codes',
            'parent_id,child_name,used,code',
            1,
            {
              code: `eq.${signupCode.trim().toUpperCase()}`
            }
          )


          if (codeError || !codes || codes.length === 0) {
            throw new Error('Invalid signup code')
          }

          const codeData = codes[0]

          if (codeData.used) {
            throw new Error('This signup code has already been used')
          }

          setName(codeData.child_name) // Use the name from the signup code
        }

        // Use API route instead of client method
        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            email, 
            password, 
            name, 
            role,
            signupCode: role === 'student' ? signupCode : null
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Signup failed')
        }

        // Profile creation is now handled by the server-side signup API

        toast({
          title: "Success",
          description: role === 'parent'
            ? "Account created successfully! Check your email to verify your account."
            : "Student account created successfully!",
        })

        if (role === 'student') {
          // Give the session time to establish before redirecting
          await new Promise(resolve => setTimeout(resolve, 500))
          window.location.href = '/'
        }
      }
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

  const handleForgotPasswordSubmit = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions"
      })

      setShowForgotPassword(false)
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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">
          {showForgotPassword
            ? 'Reset your password'
            : currentMode === 'login' ? 'Login to your account' : 'Create your account'}
        </h1>
        <p className="text-balance text-sm text-muted-foreground">
          {showForgotPassword
            ? 'Enter your email below to receive reset instructions'
            : currentMode === 'login'
              ? 'Enter your email below to login to your account'
              : 'Enter your details below to create your account'
          }
        </p>
      </div>

      <div className="grid gap-6">
        {showForgotPassword ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <Button type="button" onClick={handleForgotPasswordSubmit} className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Email'}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="underline underline-offset-4 hover:text-primary"
              >
                Back to login
              </button>
            </div>
          </>
        ) : (
          <>
            {currentMode === 'signup' && (
              <>
                <div className="grid gap-2">
                  <Label>Are you a parent or student?</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"

                      variant={role === 'parent' ? 'default' : 'outline'}
                      size="fullWidth"
                      onClick={() => setRole('parent')}
                    >
                      Parent
                    </Button>
                    <Button
                      type="button"
                      variant={role === 'student' ? 'default' : 'outline'}
                      size="fullWidth"
                      onClick={() => setRole('student')}
                    >
                      Student
                    </Button>
                  </div>
                </div>

                {role === 'student' && (
                  <div className="grid gap-2">
                    <Label htmlFor="signup_code">Signup Code</Label>
                    <Input
                      id="signup_code"
                      placeholder="Enter code from parent"
                      value={signupCode}
                      onChange={(e) => setSignupCode(e.target.value)}
                      required
                      autoComplete="off"
                    />
                  </div>
                )}

                {role === 'parent' && (
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                )}
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                {currentMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Loading...' : (currentMode === 'login' ? 'Login' : 'Sign Up')}
            </Button>

            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {currentMode === 'login' ? 'Login' : 'Sign up'} with Google
            </Button>
          </>
        )}
      </div>

      <div className="text-center text-sm">
        {currentMode === 'login' ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => setCurrentMode('signup')}
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setCurrentMode('login')}
              className="underline underline-offset-4 hover:text-primary"
            >
              Login
            </button>
          </>
        )}
      </div>
    </form>
  )
}
