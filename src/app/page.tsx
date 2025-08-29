import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('Profile data:', profile)
  console.log('Profile error:', error)
  console.log('Role:', profile?.role)

  if (profile && (profile as any).role === 'parent') {
    redirect('/parent')
  } else {
    redirect('/student')
  }
}