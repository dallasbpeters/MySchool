-- Fix student_assignments RLS policies
-- Remove conflicting policies and create proper ones

-- Drop all existing policies for student_assignments
DROP POLICY IF EXISTS "Students can view their own assignments" ON student_assignments;
DROP POLICY IF EXISTS "Students can update their own assignment status" ON student_assignments;
DROP POLICY IF EXISTS "Anyone can create student assignments" ON student_assignments;
DROP POLICY IF EXISTS "Anyone can view student assignments" ON student_assignments;

-- Create new, non-conflicting policies

-- Allow students to view their own assignment records
CREATE POLICY "Students can view their assignments" ON student_assignments
  FOR SELECT USING (auth.uid() = student_id);

-- Allow parents to view their children's assignment records
CREATE POLICY "Parents can view children assignments" ON student_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = student_assignments.student_id 
      AND profiles.parent_id = auth.uid()
    )
  );

-- Allow students to create/update their own assignment records
CREATE POLICY "Students can manage their assignments" ON student_assignments
  FOR ALL USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Allow parents to create/update assignment records for their children
CREATE POLICY "Parents can manage children assignments" ON student_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = student_assignments.student_id 
      AND profiles.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = student_assignments.student_id 
      AND profiles.parent_id = auth.uid()
    )
  );
