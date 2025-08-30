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
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    // Fast initial auth check
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User')

          // Fetch role in background, don't block rendering
          const fetchProfile = async () => {
            try {
              const { data } = await supabase
                .from('profiles')
                .select('role, name')
                .eq('id', session.user.id)
                .single()

              if (data?.role) setUserRole(data.role)
              if (data?.name) setUserName(data.name)
            } catch (error) {
              // If profile doesn't exist, keep defaults
            }
          }
          fetchProfile()
        } else {
          setUser(null)
        }
        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        setUser(session.user)
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User')
        // Fetch role in background
        try {
          const { data } = await supabase
            .from('profiles')
            .select('role, name')
            .eq('id', session.user.id)
            .single()

          if (data?.role) setUserRole(data.role)
          if (data?.name) setUserName(data.name)
        } catch (error) {
          // If profile doesn't exist, keep defaults
        }
      } else {
        setUser(null)
        setUserRole('parent')
        setUserName('')
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Don't handle redirects in navbar - let middleware or page-level redirects handle this
  // This prevents redirect loops



  // Don't show navbar on auth pages
  if (['/login', '/auth/callback', '/auth/reset-password', '/auth/test-reset', '/setup'].some(path => pathname?.startsWith(path))) {
    return null
  }

  // Debug logging - temporarily disabled to see other logs
  // console.log('ConnectedNavbar render:', { 
  //   pathname, 
  //   user: !!user, 
  //   userId: user?.id, 
  //   userRole, 
  //   userName,
  //   isLoading 
  // })

  // Show navbar immediately if we have a user, don't wait for profile
  if (!user) {
    // console.log('No user found, hiding navbar - user should be redirected to login')
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
        // Immediately redirect to login page
        window.location.href = '/login?logout=true'
        
        // Clean up in the background (this will run but page will already be navigating)
        setTimeout(() => {
          // Clear local state
          setUser(null)
          setUserRole('parent')
          setUserName('')
          
          // Try to sign out from Supabase (fire and forget)
          supabase.auth.signOut().catch(() => {
            // Ignore errors - we're already redirecting
          })
          
          // Clear all Supabase cookies
          document.cookie.split(";").forEach((c) => {
            if (c.includes('supabase')) {
              document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            }
          })
          
          // Clear localStorage
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key && key.includes('supabase')) {
              localStorage.removeItem(key)
            }
          }
        }, 0)
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
