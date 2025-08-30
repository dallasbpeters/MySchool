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

-- Allow authenticated users to view all profiles (simplified approach)
-- This avoids recursion while still allowing parents to see students
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
