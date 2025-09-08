-- Create assignment_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS assignment_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add assignment_id column to existing assignment_notes table if it doesn't exist
DO $$
BEGIN
  -- Check if assignment_id column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignment_notes'
    AND column_name = 'assignment_id'
  ) THEN
    ALTER TABLE assignment_notes
    ADD COLUMN assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on assignment_notes table
ALTER TABLE assignment_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for assignment_notes
CREATE POLICY "Students can view their own notes" ON assignment_notes
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own notes" ON assignment_notes
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own notes" ON assignment_notes
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Students can delete their own notes" ON assignment_notes
  FOR DELETE USING (auth.uid() = student_id);

-- Parent policies for managing children's notes
CREATE POLICY "Parents can view their children's notes" ON assignment_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = assignment_notes.student_id
      AND p.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can create notes for their children" ON assignment_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = assignment_notes.student_id
      AND p.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update their children's notes" ON assignment_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = assignment_notes.student_id
      AND p.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can delete their children's notes" ON assignment_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = assignment_notes.student_id
      AND p.parent_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignment_notes_student_id ON assignment_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_notes_assignment_id ON assignment_notes(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_notes_category ON assignment_notes(category);

-- Add trigger for updated_at
CREATE TRIGGER update_assignment_notes_updated_at BEFORE UPDATE ON assignment_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
