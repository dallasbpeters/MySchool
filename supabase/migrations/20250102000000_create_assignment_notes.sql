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
    
    -- Create index for the new column
    CREATE INDEX IF NOT EXISTS idx_assignment_notes_assignment_id ON assignment_notes(assignment_id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignment_notes_student_id ON assignment_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_notes_assignment_id ON assignment_notes(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_notes_category ON assignment_notes(category);
