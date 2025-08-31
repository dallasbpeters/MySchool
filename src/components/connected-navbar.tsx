'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar05 } from '@/components/ui/shadcn-io/navbar-05'
import type { Navbar05NavItem } from '@/components/ui/shadcn-io/navbar-05'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  href: string
  created_at: string
}

export function ConnectedNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string>('parent') // Default to parent
  const [userName, setUserName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCount, setNotificationCount] = useState(0)


  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()

      if (data.notifications) {
        setNotifications(data.notifications)
        setNotificationCount(data.count)
      }
    } catch (error) {
    }
  }

  useEffect(() => {
    // Fast initial auth check using API route
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user')
        const data = await response.json()

        if (data.user) {
          setUser(data.user)
          setUserName(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User')

          // Get role from user metadata first, then fetch profile
          const metadataRole = data.user.user_metadata?.role
          if (metadataRole) {
            setUserRole(metadataRole)
          }

          // Fetch full profile and notifications in background
          const fetchProfileAndNotifications = async () => {
            try {
              const profileResponse = await fetch('/api/user')
              const profileData = await profileResponse.json()

              if (profileData.user?.user_metadata?.role) {
                setUserRole(profileData.user.user_metadata.role)
              }

              // Fetch notifications after we have the user
              await fetchNotifications()
            } catch (error) {
              // Keep defaults on error
            }
          }
          fetchProfileAndNotifications()
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
    const supabase = createClient()
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


  // Show navbar immediately if we have a user, don't wait for profile
  if (!user) {
    return null
  }

  // Define navigation links based on user role
  const getNavigationLinks = (): Navbar05NavItem[] => {
    if (userRole === 'parent') {
      return [
        { href: '/parent', label: 'Dashboard' },
        { href: '/parent/children', label: 'Students' },
        { href: '/student', label: 'Student View' }
      ]
    } else if (userRole === 'student') {
      return [
        { href: '/student', label: 'My Assignments' }
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
      // Navigate to appropriate page based on role
      router.push(userRole === 'student' ? '/student' : '/parent')
      return
    }

    // Find the notification by ID
    const notification = notifications.find(n => n.id === item)
    if (notification) {
      toast({
        title: notification.title,
        description: notification.message,
      })

      // Navigate to the appropriate page
      router.push(notification.href)
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
          const supabase = createClient()
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
      userAvatar={user.user_metadata?.picture || user.user_metadata?.avatar_url}
      notificationCount={notificationCount}
      onNavItemClick={handleNavItemClick}
      onInfoItemClick={handleInfoItemClick}
      onNotificationItemClick={handleNotificationItemClick}
      onUserItemClick={handleUserItemClick}
    />
  )
}
