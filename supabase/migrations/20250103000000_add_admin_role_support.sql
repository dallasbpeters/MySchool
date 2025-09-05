-- Add admin role support to the database schema
-- This fixes the issue where admin functionality exists in code but not in database

-- First, update the role constraint to include admin
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('parent', 'student', 'admin'));

-- Add RLS policies for admin access
-- Admins can view all profiles (for user management)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Admins can update any profile (for user management)
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Admins can view all assignments
CREATE POLICY "Admins can view all assignments" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Admins can update any assignment
CREATE POLICY "Admins can update any assignment" ON assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Admins can delete any assignment  
CREATE POLICY "Admins can delete any assignment" ON assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Admins can view all student assignments
CREATE POLICY "Admins can view all student assignments" ON student_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Admins can manage all student assignments
CREATE POLICY "Admins can manage all student assignments" ON student_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Create a function to promote a user to admin (should be run manually by database admin)
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Find the user by email
  SELECT * INTO user_profile 
  FROM profiles 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN 'User with email ' || user_email || ' not found';
  END IF;
  
  -- Update their role to admin
  UPDATE profiles 
  SET role = 'admin', updated_at = NOW()
  WHERE id = user_profile.id;
  
  RETURN 'User ' || user_email || ' has been promoted to admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Important: This function should only be used by database administrators
-- Usage: SELECT promote_to_admin('admin@example.com');
