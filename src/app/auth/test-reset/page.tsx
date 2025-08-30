'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Copy, RefreshCw } from 'lucide-react'

interface DebugInfo {
  hasSession: boolean
  session: any
  urlParams: Record<string, string | null>
  hashParams: Record<string, string | null>
  authState: string
  lastAuthEvent: string | null
  errors: string[]
  logs: string[]
}

export default function TestResetPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    hasSession: false,
    session: null,
    urlParams: {},
    hashParams: {},
    authState: 'unknown',
    lastAuthEvent: null,
    errors: [],
    logs: []
  })
  const { toast } = useToast()
  const supabase = createClient()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => ({
      ...prev,
      logs: [...prev.logs, `[${timestamp}] ${message}`]
    }))
  }

  const addError = (error: string) => {
    setDebugInfo(prev => ({
      ...prev,
      errors: [...prev.errors, error]
    }))
  }

  const refreshDebugInfo = async () => {
    try {
      addLog('Refreshing debug information...')
      
      // Debug the URL parsing directly
      console.log('Current URL:', window.location.href)
      console.log('Search params:', window.location.search)
      console.log('Hash params:', window.location.hash)
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        addError(`Session error: ${sessionError.message}`)
      }

      // Parse URL parameters with more debugging
      const urlParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      
      console.log('URLSearchParams object:', urlParams)
      console.log('Code from URL:', urlParams.get('code'))
      console.log('All URL entries:', Array.from(urlParams.entries()))
      
      const urlParamsObj: Record<string, string | null> = {}
      const hashParamsObj: Record<string, string | null> = {}
      
      // Get all URL params using entries() instead of forEach
      for (const [key, value] of urlParams.entries()) {
        urlParamsObj[key] = value
        console.log(`URL param ${key}:`, value)
      }
      
      // Get all hash params
      for (const [key, value] of hashParams.entries()) {
        hashParamsObj[key] = value
        console.log(`Hash param ${key}:`, value)
      }
      
      // Also get specific parameters directly
      const code = urlParams.get('code')
      const type = urlParams.get('type')
      const error = urlParams.get('error')
      const errorCode = urlParams.get('error_code')
      
      console.log('Direct parameter access:', { code, type, error, errorCode })
      
      // If forEach didn't work but direct access does, add them manually
      if (code && Object.keys(urlParamsObj).length === 0) {
        urlParamsObj['code'] = code
        if (type) urlParamsObj['type'] = type
        if (error) urlParamsObj['error'] = error
        if (errorCode) urlParamsObj['error_code'] = errorCode
      }
      
      addLog(`Found ${Object.keys(urlParamsObj).length} URL params and ${Object.keys(hashParamsObj).length} hash params`)

      setDebugInfo(prev => ({
        ...prev,
        hasSession: !!session,
        session: session ? {
          user: {
            id: session.user.id,
            email: session.user.email,
            email_confirmed_at: session.user.email_confirmed_at,
            last_sign_in_at: session.user.last_sign_in_at,
            created_at: session.user.created_at
          },
          access_token: session.access_token ? `${session.access_token.substring(0, 20)}...` : null,
          refresh_token: session.refresh_token ? `${session.refresh_token.substring(0, 20)}...` : null,
          expires_at: session.expires_at,
          expires_in: session.expires_in
        } : null,
        urlParams: urlParamsObj,
        hashParams: hashParamsObj,
        authState: session ? 'authenticated' : 'unauthenticated'
      }))

      addLog(`Session status: ${session ? 'Found' : 'None'}`)
      if (session) {
        addLog(`User: ${session.user.email}`)
        addLog(`Token expires at: ${new Date(session.expires_at! * 1000).toLocaleString()}`)
      }
      
    } catch (error: any) {
      addError(`Debug refresh error: ${error.message}`)
    }
  }

  const attemptCodeExchange = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      
      if (!code) {
        addError('No code parameter found in URL')
        return
      }

      addLog(`Attempting to exchange code: ${code.substring(0, 10)}...`)
      setIsLoading(true)

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        addError(`Code exchange failed: ${error.message}`)
      } else {
        addLog('Code exchange successful!')
        await refreshDebugInfo()
      }

    } catch (error: any) {
      addError(`Code exchange error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testPasswordUpdate = async (e: React.FormEvent) => {
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
        description: "Password must be at least 6 characters",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    addLog(`Attempting password update...`)

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        addError(`Password update failed: ${error.message}`)
        toast({
          title: "Password Update Failed",
          description: error.message,
          variant: "destructive"
        })
      } else {
        addLog('Password updated successfully!')
        toast({
          title: "Success",
          description: "Password updated successfully"
        })
        
        // Clear form
        setPassword('')
        setConfirmPassword('')
      }

    } catch (error: any) {
      addError(`Password update error: ${error.message}`)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyDebugInfo = () => {
    const debugText = JSON.stringify(debugInfo, null, 2)
    navigator.clipboard.writeText(debugText)
    toast({
      title: "Copied",
      description: "Debug information copied to clipboard"
    })
  }

  const clearLogs = () => {
    setDebugInfo(prev => ({
      ...prev,
      logs: [],
      errors: []
    }))
  }

  useEffect(() => {
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Auth event: ${event}`)
      setDebugInfo(prev => ({
        ...prev,
        lastAuthEvent: event
      }))

      if (event === 'PASSWORD_RECOVERY') {
        addLog('PASSWORD_RECOVERY event detected - recovery session active')
      }
    })

    // Initial debug info load
    refreshDebugInfo()

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Password Reset Debug Tool
              <Badge variant={debugInfo.hasSession ? "default" : "secondary"}>
                {debugInfo.hasSession ? "Session Active" : "No Session"}
              </Badge>
            </CardTitle>
            <CardDescription>
              This page helps debug the password reset flow by showing detailed information about the current state.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Debug Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Debug Information</CardTitle>
                <CardDescription>Current authentication state</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={refreshDebugInfo} size="sm" variant="outline">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                <Button onClick={copyDebugInfo} size="sm" variant="outline">
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Session Status</Label>
                <Badge variant={debugInfo.hasSession ? "default" : "secondary"}>
                  {debugInfo.authState}
                </Badge>
              </div>

              {debugInfo.session && (
                <div className="space-y-2">
                  <Label>User Information</Label>
                  <div className="text-sm space-y-1 bg-muted p-3 rounded">
                    <div><strong>Email:</strong> {debugInfo.session.user.email}</div>
                    <div><strong>ID:</strong> {debugInfo.session.user.id}</div>
                    <div><strong>Expires:</strong> {new Date(debugInfo.session.expires_at * 1000).toLocaleString()}</div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>URL Parameters</Label>
                <div className="text-xs bg-muted p-3 rounded font-mono">
                  {Object.keys(debugInfo.urlParams).length > 0 
                    ? JSON.stringify(debugInfo.urlParams, null, 2)
                    : 'No URL parameters'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hash Parameters</Label>
                <div className="text-xs bg-muted p-3 rounded font-mono">
                  {Object.keys(debugInfo.hashParams).length > 0 
                    ? JSON.stringify(debugInfo.hashParams, null, 2)
                    : 'No hash parameters'}
                </div>
              </div>

              {debugInfo.lastAuthEvent && (
                <div className="space-y-2">
                  <Label>Last Auth Event</Label>
                  <Badge variant="outline">{debugInfo.lastAuthEvent}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-6">
            {/* Code Exchange */}
            <Card>
              <CardHeader>
                <CardTitle>Code Exchange</CardTitle>
                <CardDescription>
                  If there's a code parameter in the URL, try exchanging it for a session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={attemptCodeExchange} 
                  disabled={isLoading || !debugInfo.urlParams.code}
                  className="w-full"
                >
                  {isLoading ? 'Exchanging...' : 'Exchange Code for Session'}
                </Button>
                {!debugInfo.urlParams.code && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No code parameter found in URL
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Password Update Test */}
            <Card>
              <CardHeader>
                <CardTitle>Test Password Update</CardTitle>
                <CardDescription>
                  Test updating the password if you have a valid recovery session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={testPasswordUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-password">New Password</Label>
                    <Input
                      id="test-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter test password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-confirm-password">Confirm Password</Label>
                    <Input
                      id="test-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm test password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !debugInfo.hasSession} 
                    className="w-full"
                  >
                    {isLoading ? 'Updating...' : 'Test Password Update'}
                  </Button>
                  {!debugInfo.hasSession && (
                    <p className="text-sm text-muted-foreground">
                      No active session - password update will fail
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Logs and Errors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Debug logs and error messages</CardDescription>
            </div>
            <Button onClick={clearLogs} size="sm" variant="outline">
              Clear Logs
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {debugInfo.errors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-destructive">Errors</Label>
                  <div className="bg-destructive/10 border border-destructive/20 rounded p-3 space-y-1">
                    {debugInfo.errors.map((error, index) => (
                      <div key={index} className="text-sm text-destructive font-mono">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {debugInfo.logs.length > 0 && (
                <div className="space-y-2">
                  <Label>Debug Logs</Label>
                  <div className="bg-muted rounded p-3 max-h-60 overflow-y-auto space-y-1">
                    {debugInfo.logs.map((log, index) => (
                      <div key={index} className="text-xs font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {debugInfo.logs.length === 0 && debugInfo.errors.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No logs yet. Activity will appear here as you interact with the page.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/auth/reset-password'}
              >
                Go to Production Reset Page
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/login'}
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}