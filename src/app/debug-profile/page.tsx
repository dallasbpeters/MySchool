'use client'

import { useEffect, useState } from 'react'

export default function DebugProfile() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/fix-rls', { method: 'POST' })
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Profile Debug</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
      
      {data?.errorBefore && (
        <div className="mt-4 p-4 bg-red-50 rounded">
          <h2 className="font-bold text-red-700">Error Details:</h2>
          <p>Code: {data.errorBefore.code}</p>
          <p>Message: {data.errorBefore.message}</p>
          {data.errorBefore.code === '42P17' && (
            <div className="mt-4">
              <p className="font-bold">This is an infinite recursion error in RLS policies.</p>
              <p>To fix this, you need to run the following SQL in your Supabase SQL Editor:</p>
              <pre className="bg-white p-2 mt-2 text-xs overflow-auto">{`
-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Parents can view their students" ON profiles;
DROP POLICY IF EXISTS "Students can view their parent" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
              `}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}