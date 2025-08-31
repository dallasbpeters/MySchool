'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  name: string | null
  email: string
  role: string | null
  parent_id: string | null
  created_at: string | null
  updated_at: string | null
}

interface UserData {
  user: User | null
  profile: Profile | null
  loading: boolean
}

export function useUser(): UserData {
  const [userData, setUserData] = useState<UserData>({
    user: null,
    profile: null,
    loading: true,
  })

  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (!mounted) return

        if (user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (mounted) {
            setUserData({
              user,
              profile: profile as Profile,
              loading: false,
            })
          }
        } else {
          if (mounted) {
            setUserData({
              user: null,
              profile: null,
              loading: false,
            })
          }
        }
      } catch (error) {
        if (mounted) {
          setUserData({
            user: null,
            profile: null,
            loading: false,
          })
        }
      }
    }

    // Try getSession as fallback
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (mounted) {
            setUserData({
              user: session.user,
              profile: profile as Profile,
              loading: false,
            })
          }
        } else {
          if (mounted) {
            setUserData({
              user: null,
              profile: null,
              loading: false,
            })
          }
        }
      } catch (error) {
        if (mounted) {
          setUserData({
            user: null,
            profile: null,
            loading: false,
          })
        }
      }
    }

    // Try getUser first, then getSession as fallback
    getUser().catch(() => getSession())

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setUserData({
            user: session.user,
            profile: profile as Profile,
            loading: false,
          })
        } else {
          setUserData({
            user: null,
            profile: null,
            loading: false,
          })
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return userData
}
