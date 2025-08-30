'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Plus, Copy, Users, Calendar, CheckCircle, Clock, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

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
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchChildren()
    fetchSignupCodes()
  }, [])

  const fetchChildren = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, created_at')
      .eq('parent_id', user.id)
      .eq('role', 'student')

    if (!error && data) {
      setChildren(data)
      // Fetch assignment statuses for each child
      data.forEach(child => fetchAssignmentStatus(child.id))
    }
  }

  const fetchSignupCodes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('signup_codes')
      .select('*')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSignupCodes(data as any)
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
    if (!newChildName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a child name",
        variant: "destructive"
      })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Generate a random 8-character code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()

    const { error } = await supabase
      .from('signup_codes')
      .insert({
        parent_id: user.id,
        code,
        child_name: newChildName.trim()
      } as any)

    if (!error) {
      toast({
        title: "Success",
        description: `Signup code generated for ${newChildName}`,
      })
      setNewChildName('')
      setIsAddingChild(false)
      fetchSignupCodes()
    } else {
      toast({
        title: "Error",
        description: "Failed to generate signup code",
        variant: "destructive"
      })
    }
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    toast({
      title: "Copied",
      description: "Signup code copied to clipboard",
    })
  }

  const deleteCode = async (codeId: string) => {
    const { error } = await supabase
      .from('signup_codes')
      .delete()
      .eq('id', codeId)

    if (!error) {
      toast({
        title: "Success",
        description: "Signup code deleted",
      })
      fetchSignupCodes()
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Children Management</h1>
        <p className="text-muted-foreground">
          Manage your children and track their assignment progress
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Existing Children */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Children ({children.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {children.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
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
        <Card>
          <CardHeader>
            <CardTitle>Signup Codes</CardTitle>
            <CardDescription>
              Generate codes for your children to create their accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Sheet open={isAddingChild} onOpenChange={setIsAddingChild}>
              <SheetTrigger asChild>
                <Button className="w-full mb-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Child
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Generate Signup Code</SheetTitle>
                  <SheetDescription>
                    Create a signup code for your child to register their account
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
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
                    <Button variant="outline" onClick={() => setIsAddingChild(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="space-y-3">
              {signupCodes.map((code) => (
                <Card key={code.id} className={code.used ? 'bg-muted/50' : 'border-green-200 bg-green-50'}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="bg-background px-2 py-1 rounded font-mono text-sm">
                            {code.code}
                          </code>
                          {!code.used && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyCode(code.code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm font-medium mt-1">{code.child_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {code.used ? 'Used' : `Expires ${format(new Date(code.expires_at), 'MMM d, yyyy')}`}
                        </p>
                      </div>
                      {!code.used && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteCode(code.id)}
                        >
                          Delete
                        </Button>
                      )}
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