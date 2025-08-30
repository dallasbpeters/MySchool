'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Copy, ExternalLink } from 'lucide-react'

export default function SetupPage() {
  const [copied, setCopied] = useState(false)

  const sqlSchema = `-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('parent', 'student')) DEFAULT 'student',
  parent_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content JSONB, -- Rich text content from WYSIWYG editor
  links JSONB, -- Array of links
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create student_assignments table for tracking completion
CREATE TABLE IF NOT EXISTS student_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(assignment_id, student_id)
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Parents can create assignments" ON assignments;
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON assignments;
DROP POLICY IF EXISTS "Parents can update their own assignments" ON assignments;
DROP POLICY IF EXISTS "Parents can delete their own assignments" ON assignments;
DROP POLICY IF EXISTS "Students can view their own assignments" ON student_assignments;
DROP POLICY IF EXISTS "Students can update their own assignment status" ON student_assignments;
DROP POLICY IF EXISTS "Anyone can create student assignments" ON student_assignments;
DROP POLICY IF EXISTS "Anyone can view student assignments" ON student_assignments;

-- Profiles policies (simplified to avoid recursion)
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Assignments policies (simplified)
CREATE POLICY "Parents can create assignments" ON assignments
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Authenticated users can view assignments" ON assignments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Parents can update their own assignments" ON assignments
  FOR UPDATE USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their own assignments" ON assignments
  FOR DELETE USING (auth.uid() = parent_id);

-- Student assignments policies (simplified to avoid recursion)
CREATE POLICY "Students can view their own assignments" ON student_assignments
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own assignment status" ON student_assignments
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Anyone can create student assignments" ON student_assignments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view student assignments" ON student_assignments
  FOR SELECT USING (true);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name',
    COALESCE(new.raw_user_meta_data->>'role', 'student')::text
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create profile for existing users (if any)
INSERT INTO profiles (id, email, name, role)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'name',
  COALESCE(raw_user_meta_data->>'role', 'student')::text
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET 
  name = COALESCE(EXCLUDED.name, profiles.name),
  role = COALESCE(EXCLUDED.role, profiles.role);`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlSchema)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }


  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Database Setup Required</CardTitle>
            <CardDescription>
              Your Supabase database needs to be initialized with the required tables and policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertTitle>Database Not Initialized</AlertTitle>
              <AlertDescription>
                The profiles table and other required tables don't exist in your Supabase database.
                Follow the steps below to set them up.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Setup Instructions:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                  <div className="flex-1">
                    <p className="font-medium">Copy the SQL schema</p>
                    <p className="text-sm text-muted-foreground">Click the button below to copy the entire schema to your clipboard</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                  <div className="flex-1">
                    <p className="font-medium">Open Supabase SQL Editor</p>
                    <p className="text-sm text-muted-foreground">Go to your Supabase dashboard → SQL Editor</p>
                    <a 
                      href="https://supabase.com/dashboard/project/_/sql" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                    >
                      Open Supabase Dashboard <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                  <div className="flex-1">
                    <p className="font-medium">Run the SQL</p>
                    <p className="text-sm text-muted-foreground">Paste the schema and click "Run" to create all tables and policies</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                  <div className="flex-1">
                    <p className="font-medium">Return to the app</p>
                    <p className="text-sm text-muted-foreground">After running the SQL, go back to the login page and create your account</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">SQL Schema</h3>
                <Button onClick={copyToClipboard} variant="outline" className="gap-2">
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy SQL
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">{sqlSchema}</pre>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = '/login'}
                className="flex-1"
              >
                Go to Login
              </Button>
              <Button 
                onClick={() => window.location.href = '/fix-role'}
                variant="outline"
                className="flex-1"
              >
                Fix Existing Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}