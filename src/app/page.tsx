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

  // If no profile exists, default to student role
  if (error) {
    redirect('/student')
  }

  // Default to student if no profile or role
  if (!profile || !profile.role) {
    redirect('/student')
  }

  // Redirect based on role
  if (profile.role === 'parent') {
    redirect('/parent')
  } else if (profile.role === 'student') {
    redirect('/student')
  } else {
    // Unknown role, default to student
    redirect('/student')
  }
}
