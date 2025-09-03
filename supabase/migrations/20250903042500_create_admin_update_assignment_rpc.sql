-- Create RPC function for admin to update assignments (bypasses RLS)
CREATE OR REPLACE FUNCTION admin_update_assignment(
  assignment_id UUID,
  assignment_title TEXT,
  assignment_content JSONB,
  assignment_links JSONB,
  assignment_due_date DATE,
  assignment_category TEXT,
  assignment_is_recurring BOOLEAN,
  assignment_recurrence_pattern JSONB,
  assignment_recurrence_end_date DATE,
  assignment_next_due_date DATE
)
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
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE assignments 
  SET 
    title = assignment_title,
    content = assignment_content,
    links = assignment_links,
    due_date = assignment_due_date,
    category = assignment_category,
    is_recurring = assignment_is_recurring,
    recurrence_pattern = assignment_recurrence_pattern,
    recurrence_end_date = assignment_recurrence_end_date,
    next_due_date = assignment_next_due_date,
    updated_at = NOW()
  WHERE assignments.id = assignment_id
  RETURNING 
    assignments.id,
    assignments.parent_id,
    assignments.title,
    assignments.content,
    assignments.links,
    assignments.due_date,
    assignments.category,
    assignments.is_recurring,
    assignments.recurrence_pattern,
    assignments.recurrence_end_date,
    assignments.next_due_date,
    assignments.created_at,
    assignments.updated_at;
$$;