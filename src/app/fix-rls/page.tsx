'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FixRLS() {
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const fixPolicies = async () => {
    setStatus('Fixing RLS policies...')
    setError('')
    
    const supabase = createClient()
    
    // SQL to fix the policies
    const sql = `
      -- Drop all existing policies on profiles table
      DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
      DROP POLICY IF EXISTS "Parents can view their students" ON profiles;
      DROP POLICY IF EXISTS "Students can view their parent" ON profiles;

      -- Create simple, non-recursive policies
      CREATE POLICY "Users can view their own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);

      CREATE POLICY "Users can update their own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);

      CREATE POLICY "Users can insert their own profile" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    `

    try {
      // Note: This won't work from client-side, you need to run in Supabase dashboard
      setStatus('Please run the following SQL in your Supabase SQL Editor:')
      setError(sql)
    } catch (err) {
      setError(String(err))
    }
  }

  const testProfile = async () => {
    setStatus('Testing profile access...')
    setError('')
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Not logged in')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      setError(`Error: ${profileError.message} (${profileError.code})`)
    } else {
      setStatus(`Success! Profile: ${JSON.stringify(profile, null, 2)}`)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Fix RLS Policies</h1>
      
      <div className="space-y-4">
        <button
          onClick={fixPolicies}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Show SQL to Fix Policies
        </button>

        <button
          onClick={testProfile}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-4"
        >
          Test Profile Access
        </button>

        {status && (
          <div className="p-4 bg-gray-100 rounded">
            <pre className="whitespace-pre-wrap">{status}</pre>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 rounded">
            <pre className="whitespace-pre-wrap text-red-600">{error}</pre>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h2 className="font-bold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Go to your Supabase Dashboard</li>
          <li>Navigate to SQL Editor</li>
          <li>Click "Show SQL to Fix Policies" above</li>
          <li>Copy the SQL that appears and run it in Supabase SQL Editor</li>
          <li>Click "Test Profile Access" to verify it's working</li>
        </ol>
      </div>
    </div>
  )
}