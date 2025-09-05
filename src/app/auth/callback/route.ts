import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (data.user && !error) {


      // Check if profile exists, create one if not
      let userProfile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', data.user.id)
        .single()



      if (!existingProfile) {

        // Create profile for new Google OAuth user
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
            role: 'parent' // Default to parent role for Google OAuth
          })
          .select('role')
          .single()


        userProfile = newProfile
      } else {
        userProfile = existingProfile
      }

      // Redirect based on user role
      let redirectPath = '/'
      if (userProfile?.role === 'admin') {
        redirectPath = '/admin'
      } else if (userProfile?.role === 'parent') {
        redirectPath = '/parent'
      } else if (userProfile?.role === 'student') {
        redirectPath = '/student'
      }


      return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
    }
  }

  // URL to redirect to after sign in process completes (fallback)
  return NextResponse.redirect(requestUrl.origin)
}
