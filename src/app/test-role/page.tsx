import { createClient } from '@/lib/supabase/server'

export default async function TestRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not logged in</div>
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Role Debug Info</h1>
      <div className="space-y-2">
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>User Email:</strong> {user.email}</p>
        {error ? (
          <div>
            <p className="text-red-500">Error: {error.message}</p>
            <p className="text-red-500">Code: {error.code}</p>
          </div>
        ) : (
          <div>
            <p><strong>Profile Role:</strong> {profile?.role}</p>
            <p><strong>Profile Data:</strong></p>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(profile, null, 2)}</pre>
            <p><strong>Role === 'parent':</strong> {String(profile?.role === 'parent')}</p>
            <p><strong>Role type:</strong> {typeof profile?.role}</p>
          </div>
        )}
      </div>
    </div>
  )
}