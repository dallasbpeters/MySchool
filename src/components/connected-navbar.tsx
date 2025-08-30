'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar05 } from '@/components/ui/shadcn-io/navbar-05'
import type { Navbar05NavItem } from '@/components/ui/shadcn-io/navbar-05'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function ConnectedNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string>('parent') // Default to parent
  const [userName, setUserName] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    // Fast initial auth check
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User')
        
        // Fetch role in background, don't block rendering
        supabase
          .from('profiles')
          .select('role, name')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role) setUserRole(data.role)
            if (data?.name) setUserName(data.name)
          })
          .catch(() => {
            // If profile doesn't exist, keep defaults
          })
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User')
        // Fetch role in background
        supabase
          .from('profiles')
          .select('role, name')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role) setUserRole(data.role)
            if (data?.name) setUserName(data.name)
          })
          .catch(() => {})
      } else {
        setUser(null)
        setUserRole('parent')
        setUserName('')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Don't show navbar on auth pages
  if (['/login', '/auth/callback', '/setup'].some(path => pathname?.startsWith(path))) {
    return null
  }

  // Show navbar immediately if we have a user, don't wait for profile
  if (!user) {
    return null
  }

  // Define navigation links based on user role
  const getNavigationLinks = (): Navbar05NavItem[] => {
    if (userRole === 'parent') {
      return [
        { href: '/parent', label: 'Dashboard' },
        { href: '/parent/children', label: 'Manage Children' },
        { href: '/student', label: 'Student View' }
      ]
    } else if (userRole === 'student') {
      return [
        { href: '/student', label: 'My Assignments' },
        { href: '/parent', label: 'Parent View' }
      ]
    } else {
      return [
        { href: '/parent', label: 'Dashboard' },
        { href: '/setup', label: 'Setup' }
      ]
    }
  }

  const handleNavItemClick = (href: string) => {
    router.push(href)
  }

  const handleInfoItemClick = (item: string) => {
    switch (item) {
      case 'help':
        toast({
          title: 'Help Center',
          description: 'Visit our help documentation for guidance on using MySchool.'
        })
        break
      case 'documentation':
        toast({
          title: 'Documentation',
          description: 'Documentation coming soon!'
        })
        break
      case 'contact':
        toast({
          title: 'Contact Support',
          description: 'Email us at support@myschool.app for assistance.'
        })
        break
      case 'feedback':
        toast({
          title: 'Send Feedback',
          description: 'We\'d love to hear from you! Email feedback@myschool.app'
        })
        break
    }
  }

  const handleNotificationItemClick = (item: string) => {
    if (item === 'view-all') {
      toast({
        title: 'All Notifications',
        description: 'Full notifications page coming soon!'
      })
      return
    }

    // For now, show generic responses for the default notification items
    switch (item) {
      case 'notification1':
        toast({
          title: 'New Assignment',
          description: 'You have a new assignment. Check your dashboard for details.'
        })
        router.push(userRole === 'student' ? '/student' : '/parent')
        break
      case 'notification2':
        toast({
          title: 'Email Notification',
          description: 'Your daily assignment email has been sent successfully.'
        })
        break
      case 'notification3':
        toast({
          title: 'System Update',
          description: 'MySchool has been updated with new features!'
        })
        break
      default:
        toast({
          title: 'Notification',
          description: 'Notification details coming soon!'
        })
    }
  }

  const handleUserItemClick = async (item: string) => {
    switch (item) {
      case 'profile':
        toast({
          title: 'Profile',
          description: 'Profile management coming soon!'
        })
        break
      case 'settings':
        toast({
          title: 'Settings',
          description: 'Settings page coming soon!'
        })
        break
      case 'billing':
        toast({
          title: 'Billing',
          description: 'Billing management coming soon!'
        })
        break
      case 'logout':
        try {
          await supabase.auth.signOut()
          router.push('/login')
          toast({
            title: 'Logged Out',
            description: 'You have been successfully logged out.'
          })
        } catch (error) {
          console.error('Error logging out:', error)
          toast({
            title: 'Error',
            description: 'Failed to log out. Please try again.',
            variant: 'destructive'
          })
        }
        break
    }
  }

  return (
    <Navbar05
      logoHref="/"
      navigationLinks={getNavigationLinks()}
      userName={userName}
      userEmail={user.email || ''}
      userAvatar={user.user_metadata?.avatar_url}
      notificationCount={3} // Show sample notifications
      onNavItemClick={handleNavItemClick}
      onInfoItemClick={handleInfoItemClick}
      onNotificationItemClick={handleNotificationItemClick}
      onUserItemClick={handleUserItemClick}
    />
  )
}