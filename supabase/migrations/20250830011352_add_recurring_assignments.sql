-- Add recurring assignment fields to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB; -- Will store days of week, frequency, etc.
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS next_due_date DATE;

-- Add indexes for better performance on recurring assignment queries
CREATE INDEX IF NOT EXISTS idx_assignments_is_recurring ON assignments(is_recurring);
CREATE INDEX IF NOT EXISTS idx_assignments_next_due_date ON assignments(next_due_date) WHERE is_recurring = true;