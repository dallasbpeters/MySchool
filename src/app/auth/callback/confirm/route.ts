import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // Get user profile to determine correct redirect
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        // Redirect based on user role
        if (profile?.role === 'admin') {
          redirect('/admin')
        } else if (profile?.role === 'parent') {
          redirect('/parent')
        } else if (profile?.role === 'student') {
          redirect('/student')
        } else {
          redirect(next)
        }
      } else {
        redirect(next)
      }
    }
  }

  // redirect the user to an error page with some instructions
  redirect('/error')
}
