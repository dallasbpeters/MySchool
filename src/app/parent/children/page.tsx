'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchClient } from '@/lib/supabase/fetch-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Plus, Copy, Users, Calendar, CheckCircle, Clock, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import ColourfulText from '@/components/ui/colourful-text'

interface Child {
  id: string
  name: string
  email: string
  created_at: string
}

interface SignupCode {
  id: string
  code: string
  child_name: string
  used: boolean
  used_by: string | null
  expires_at: string
  created_at: string
}

interface AssignmentStatus {
  assignment_id: string
  assignment_title: string
  due_date: string
  completed: boolean
  completed_at: string | null
}

export default function ChildrenManagement() {
  const [children, setChildren] = useState<Child[]>([])
  const [signupCodes, setSignupCodes] = useState<SignupCode[]>([])
  const [assignmentStatuses, setAssignmentStatuses] = useState<Record<string, AssignmentStatus[]>>({})
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [newChildName, setNewChildName] = useState('')
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const initUser = async () => {
      try {
        // Test with custom fetch client to bypass SDK issues
        const { data, error } = await fetchClient.query('profiles', 'count', 1)

        if (error) {
          throw error
        }

        // Get user from server-side API (which works since middleware allows access)
        const userResponse = await fetch('/api/user')
        const { user: serverUser, error: userError } = await userResponse.json()

        if (serverUser) {
          setUser(serverUser)
          setIsLoading(false)
          return
        }

        // Fallback: try to get profile data from database
        const { data: profiles, error: profileError } = await fetchClient.query('profiles', 'id,email,name,role', 1)

        // Test auth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          setAccessToken(session.access_token)
          setIsLoading(false)
          fetchChildren(session.user)
          fetchSignupCodes(session.user)
        } else {
          // Try to get user from profiles
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, name, role')
            .limit(1)

          if (profiles && profiles.length > 0) {
            const profile = profiles[0]
            const user = {
              id: profile.id,
              email: profile.email || 'authenticated@example.com',
              user_metadata: { full_name: profile.name || 'Authenticated User' }
            }
            setUser(user)
            setIsLoading(false)
            fetchChildren(user)
            fetchSignupCodes(user)
          } else {
            setIsLoading(false)
          }
        }
      } catch (error) {
        setIsLoading(false)
      }
    }

    initUser()
  }, [])

  // Separate effect to load data when user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      fetchChildren(user)
      fetchSignupCodes(user)
    }
  }, [user, isLoading])

  // Show loading only while checking auth
  if (isLoading) {
    return <div>Loading...</div>
  }

  // If no user after loading, show login message
  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>You need to be logged in to access this page.</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go to Login
        </button>
      </div>
    )
  }

  const fetchChildren = async (currentUser = user) => {
    if (!currentUser) return

    try {
      const response = await fetch('/api/children')
      const data = await response.json()

      if (data.children) {
        setChildren(data.children)
        // Fetch assignment statuses for each child
        data.children.forEach((child: any) => fetchAssignmentStatus(child.id))
      }
    } catch (error) {
      // Handle error silently
    }
  }

  const fetchSignupCodes = async (currentUser = user) => {
    if (!currentUser) return

    try {
      const response = await fetch('/api/signup-codes')
      const result = await response.json()

      if (response.ok && result.success && result.data) {
        // Sort by created_at descending (newest first)
        const sortedCodes = result.data.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setSignupCodes(sortedCodes)
      }
    } catch (error) {
      // Handle error silently
    }
  }

  const fetchAssignmentStatus = async (childId: string) => {
    const { data, error } = await supabase
      .from('student_assignments')
      .select(`
        assignment_id,
        completed,
        completed_at,
        assignments!inner(id, title, due_date)
      `)
      .eq('student_id', childId)

    if (!error && data) {
      const statuses = data.map((item: any) => ({
        assignment_id: item.assignment_id,
        assignment_title: item.assignments.title,
        due_date: item.assignments.due_date,
        completed: item.completed,
        completed_at: item.completed_at
      }))

      setAssignmentStatuses(prev => ({
        ...prev,
        [childId]: statuses
      }))
    }
  }

  const generateSignupCode = async () => {
    // Input validation only
    if (!newChildName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a child name",
        variant: "destructive"
      })
      return
    }

    // INSTANT: Generate code and show it immediately
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    const timestamp = new Date().toISOString()

    // Create optimistic signup code object
    const optimisticCode = {
      id: `temp-${Date.now()}`,
      code,
      child_name: newChildName.trim(),
      used: false,
      used_by: null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      created_at: timestamp,
      status: 'pending' // Track sync status
    }

    // INSTANT: Show success and update UI immediately
    setGeneratedCode(code)
    setSignupCodes(prev => [optimisticCode, ...prev])
    toast({
      title: "Code Generated!",
      description: `Signup code ${code} created for ${newChildName.trim()}`,
    })

    // Clear form but keep sheet open to show the generated code
    setNewChildName('')
    // DON'T close the sheet here - let the user close it manually after seeing the code

    // BACKGROUND: Save to database (fire and forget)
    saveCodeToDatabase(optimisticCode)
  }

  const saveCodeToDatabase = async (codeData: any) => {
    try {
      if (!user?.id) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to generate codes",
          variant: "destructive"
        })
        return
      }

      // Use server-side API for signup code creation
      const response = await fetch('/api/signup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeData.code,
          child_name: codeData.child_name,
          expires_at: codeData.expires_at
        })
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        // Update the optimistic code to show error state
        setSignupCodes(prev =>
          prev.map(c =>
            c.id === codeData.id
              ? { ...c, status: 'error', error: result.error || 'Unknown error' }
              : c
          )
        )

        // Show non-intrusive error
        toast({
          title: "Sync Warning",
          description: "Code created locally but may not be saved to server. Try refreshing the page.",
          variant: "destructive"
        })
      } else {
        // Update status to saved
        setSignupCodes(prev =>
          prev.map(c =>
            c.id === codeData.id
              ? { ...c, status: 'saved' }
              : c
          )
        )

        // Refresh the list to get server data
        setTimeout(() => {
          if (user) {
            fetchSignupCodes(user)
          }
        }, 500)
      }
    } catch (error) {
      // Handle error silently
    }
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    toast({
      title: "Copied",
      description: "Signup code copied to clipboard",
    })
  }

  const copyGeneratedCodeWithWrapper = async (code: string) => {
    const wrappedCode = `@ColourfulText("${code}")`
    await navigator.clipboard.writeText(wrappedCode)
    toast({
      title: "Copied",
      description: "Code with @ColourfulText wrapper copied to clipboard",
    })
  }

  const handleSheetClose = () => {
    setIsAddingChild(false)
    setGeneratedCode(null)
    setNewChildName('')
  }

  const deleteCode = async (codeId: string) => {
    // INSTANT: Remove from UI immediately
    const codeToDelete = signupCodes.find(c => c.id === codeId)

    setSignupCodes(prev => prev.filter(c => c.id !== codeId))

    toast({
      title: "Code Deleted",
      description: `Signup code deleted`,
    })

    // BACKGROUND: Delete from database
    try {
      const response = await fetch(`/api/signup-codes?id=${codeId}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (!response.ok || result.error) {
        // Restore the code on error
        if (codeToDelete) {
          setSignupCodes(prev => [codeToDelete, ...prev])
          toast({
            title: "Delete Failed",
            description: "Could not delete code from server. Code restored.",
            variant: "destructive"
          })
        }
      }
    } catch (error) {

      // Restore the code on error
      if (codeToDelete) {
        setSignupCodes(prev => [codeToDelete, ...prev])
        toast({
          title: "Delete Failed",
          description: "Network error. Code restored.",
          variant: "destructive"
        })
      }
    }
  }

  return (
    <div className="z-10 relative container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Students</h1>
        <p className="text-muted-foreground">
          Manage your students and track their assignment progress
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Existing Children */}
        <Card className="gap-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Children ({children.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {children.length === 0 ? (
              <p className="text-muted-foreground py-6">
                No children registered yet. Generate a signup code to add your first child.
              </p>
            ) : (
              <div className="space-y-4">
                {children.map((child) => (
                  <Card key={child.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{child.name}</h3>
                          <p className="text-sm text-muted-foreground">{child.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {format(new Date(child.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedChild(selectedChild === child.id ? null : child.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>

                      {selectedChild === child.id && assignmentStatuses[child.id] && (
                        <div className="mt-4 p-3 bg-muted rounded">
                          <h4 className="text-sm font-medium mb-2">Assignment Progress</h4>
                          {assignmentStatuses[child.id].length === 0 ? (
                            <p className="text-xs text-muted-foreground">No assignments yet</p>
                          ) : (
                            <div className="space-y-2">
                              {assignmentStatuses[child.id].map((status) => (
                                <div key={status.assignment_id} className="flex items-center justify-between text-xs">
                                  <span className="flex-1">{status.assignment_title}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">
                                      Due: {format(new Date(status.due_date), 'MMM d')}
                                    </span>
                                    {status.completed ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Clock className="h-4 w-4 text-yellow-500" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signup Codes */}
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Signup Codes</CardTitle>
            <CardDescription>
              Generate codes for your children to create their accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Sheet open={isAddingChild} onOpenChange={(open) => !open && handleSheetClose()}>
              <SheetTrigger asChild>
                <Button
                  className="w-full mb-4 gap-2"
                  onClick={() => {
                    // Reset all sheet state when opening
                    setGeneratedCode(null)
                    setNewChildName('')
                    setIsAddingChild(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add New Child
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>
                    {generatedCode ? 'Signup Code Generated' : 'Generate Signup Code'}
                  </SheetTitle>
                  <SheetDescription>
                    {generatedCode
                      ? 'Your child can use this code to register their account'
                      : 'Create a signup code for your child to register their account'
                    }
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  {generatedCode ? (
                    // Show generated code with ColourfulText wrapper
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-mono bg-background p-4 rounded-lg border">
                          <ColourfulText text={generatedCode} />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => copyCode(generatedCode)}
                          variant="outline"
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy Code
                        </Button>
                      </div>

                      <Button onClick={handleSheetClose} variant="outline" className="w-full">
                        Done
                      </Button>
                    </div>
                  ) : (
                    // Show form to generate code
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="child_name">Child's Name</Label>
                        <Input
                          id="child_name"
                          placeholder="Enter your child's name"
                          value={newChildName}
                          onChange={(e) => setNewChildName(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={generateSignupCode} className="flex-1">
                          Generate Code
                        </Button>
                        <Button variant="outline" onClick={handleSheetClose}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <div className="space-y-3">
              {signupCodes.filter(code => !code.used).map((code) => (
                <Card key={code.id} className="border-green-600 bg-green-50 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="bg-background px-2 py-1 rounded font-mono text-sm">
                            {code.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCode(code.code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm font-medium mt-1">{code.child_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Expires {format(new Date(code.expires_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCode(code.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
