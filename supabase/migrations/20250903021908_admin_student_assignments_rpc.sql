-- Create RPC function for admin to get student assignments
CREATE OR REPLACE FUNCTION admin_get_student_assignments(
  p_assignment_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL
)
RETURNS TABLE (
  assignment_id UUID,
  student_id UUID,
  completed BOOLEAN,
  completed_at TIMESTAMPTZ,
  instance_date DATE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    sa.assignment_id,
    sa.student_id,
    sa.completed,
    sa.completed_at,
    sa.instance_date
  FROM student_assignments sa
  WHERE 
    (p_assignment_id IS NULL OR sa.assignment_id = p_assignment_id)
    AND (p_student_id IS NULL OR sa.student_id = p_student_id);
$$;

-- Create RPC function for getting all assignments with parent info
CREATE OR REPLACE FUNCTION get_all_assignments_with_parents()
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  title TEXT,
  content JSONB,
  links JSONB,
  due_date DATE,
  category TEXT,
  is_recurring BOOLEAN,
  recurrence_pattern JSONB,
  recurrence_end_date DATE,
  next_due_date DATE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  parent_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    a.id,
    a.parent_id,
    a.title,
    a.content,
    a.links,
    a.due_date,
    a.category,
    a.is_recurring,
    a.recurrence_pattern,
    a.recurrence_end_date,
    a.next_due_date,
    a.created_at,
    a.updated_at,
    p.name as parent_name
  FROM assignments a
  LEFT JOIN profiles p ON a.parent_id = p.id
  ORDER BY a.due_date ASC;
$$;