import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if database is set up by trying to access the profiles table
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('Profile data:', profile)
  console.log('Profile error:', error)
  console.log('Role:', profile?.role)

  // If table doesn't exist, redirect to setup
  if (error && error.code === 'PGRST205') {
    redirect('/setup')
  }

  // If no profile exists for user, redirect to fix-role
  if (error && error.code === 'PGRST116') {
    redirect('/fix-role')
  }

  if (profile && (profile as any).role === 'parent') {
    redirect('/parent')
  } else {
    redirect('/student')
  }
}