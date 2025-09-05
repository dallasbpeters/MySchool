-- Investigation and fix for data integrity issues
-- This helps identify and resolve privacy and data isolation problems

-- Create a function to audit assignment visibility (for debugging)
CREATE OR REPLACE FUNCTION audit_assignment_visibility()
RETURNS TABLE (
  assignment_id UUID,
  assignment_title TEXT,
  created_by_email TEXT,
  created_by_role TEXT,
  assigned_to_email TEXT,
  assigned_to_parent_email TEXT,
  assigned_to_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as assignment_id,
    a.title as assignment_title,
    creator.email as created_by_email,
    creator.role as created_by_role,
    student.email as assigned_to_email,
    parent.email as assigned_to_parent_email,
    student.role as assigned_to_role
  FROM assignments a
  LEFT JOIN profiles creator ON a.parent_id = creator.id
  LEFT JOIN student_assignments sa ON a.id = sa.assignment_id
  LEFT JOIN profiles student ON sa.student_id = student.id
  LEFT JOIN profiles parent ON student.parent_id = parent.id
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to audit parent-child relationships
CREATE OR REPLACE FUNCTION audit_parent_child_relationships()
RETURNS TABLE (
  child_id UUID,
  child_email TEXT,
  child_name TEXT,
  parent_id UUID,
  parent_email TEXT,
  parent_name TEXT,
  relationship_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    child.id as child_id,
    child.email as child_email,
    child.name as child_name,
    child.parent_id as parent_id,
    parent.email as parent_email,
    parent.name as parent_name,
    CASE 
      WHEN parent.id IS NULL THEN 'ORPHANED - No Parent Found'
      WHEN parent.role != 'parent' THEN 'INVALID - Parent Role Incorrect'
      ELSE 'VALID'
    END as relationship_status
  FROM profiles child
  LEFT JOIN profiles parent ON child.parent_id = parent.id
  WHERE child.role = 'student'
  ORDER BY relationship_status, child.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to fix orphaned children (those with invalid parent_id)
CREATE OR REPLACE FUNCTION fix_orphaned_children()
RETURNS TEXT AS $$
DECLARE
  orphan_count INTEGER;
  fix_count INTEGER := 0;
  orphan_record RECORD;
BEGIN
  -- Count orphaned children
  SELECT COUNT(*) INTO orphan_count
  FROM profiles child
  LEFT JOIN profiles parent ON child.parent_id = parent.id
  WHERE child.role = 'student' 
    AND (parent.id IS NULL OR parent.role != 'parent');
  
  IF orphan_count = 0 THEN
    RETURN 'No orphaned children found. All relationships are valid.';
  END IF;
  
  -- Log the orphaned children for manual review
  FOR orphan_record IN 
    SELECT child.id, child.email, child.name, child.parent_id
    FROM profiles child
    LEFT JOIN profiles parent ON child.parent_id = parent.id
    WHERE child.role = 'student' 
      AND (parent.id IS NULL OR parent.role != 'parent')
  LOOP
    -- For now, just log - don't automatically fix
    -- Real fixes should be done manually after investigation
    RAISE NOTICE 'Orphaned child found: % (%) - parent_id: %', 
      orphan_record.name, orphan_record.email, orphan_record.parent_id;
  END LOOP;
  
  RETURN 'Found ' || orphan_count || ' orphaned children. Check logs for details.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to easily see assignment cross-contamination
CREATE OR REPLACE VIEW assignment_access_audit AS
SELECT DISTINCT
  a.id as assignment_id,
  a.title,
  creator.email as created_by,
  creator.name as creator_name,
  student.email as assigned_to,
  student.name as student_name,
  parent.email as student_parent,
  parent.name as parent_name,
  CASE 
    WHEN creator.id = parent.id THEN 'VALID - Same Family'
    WHEN creator.role = 'admin' THEN 'ADMIN - Cross Family Access'
    ELSE 'POTENTIAL ISSUE - Cross Family Assignment'
  END as access_status
FROM assignments a
LEFT JOIN profiles creator ON a.parent_id = creator.id
LEFT JOIN student_assignments sa ON a.id = sa.assignment_id
LEFT JOIN profiles student ON sa.student_id = student.id
LEFT JOIN profiles parent ON student.parent_id = parent.id
WHERE sa.assignment_id IS NOT NULL
ORDER BY access_status, a.created_at DESC;

-- Note: To use these audit functions:
-- SELECT * FROM audit_assignment_visibility();
-- SELECT * FROM audit_parent_child_relationships();
-- SELECT fix_orphaned_children();
-- SELECT * FROM assignment_access_audit;
