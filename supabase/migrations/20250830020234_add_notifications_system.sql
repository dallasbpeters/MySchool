-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies - users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to create notifications for assignment-related activities
CREATE OR REPLACE FUNCTION create_assignment_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_assignment_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, metadata)
  VALUES (
    p_user_id, 
    p_title, 
    p_message, 
    p_type,
    CASE 
      WHEN p_assignment_id IS NOT NULL THEN 
        jsonb_build_object('assignment_id', p_assignment_id)
      ELSE '{}'::jsonb
    END
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications when assignments are created/updated
CREATE OR REPLACE FUNCTION notify_students_of_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all students assigned to this assignment
  INSERT INTO notifications (user_id, title, message, type, metadata)
  SELECT 
    sa.student_id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'New Assignment: ' || NEW.title
      ELSE 'Assignment Updated: ' || NEW.title
    END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'You have a new assignment due on ' || NEW.due_date::text
      ELSE 'An assignment has been updated. Check the details.'
    END,
    'info',
    jsonb_build_object('assignment_id', NEW.id, 'action', CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'updated' END)
  FROM student_assignments sa
  WHERE sa.assignment_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for assignment notifications
DROP TRIGGER IF EXISTS trigger_notify_assignment_created ON assignments;
CREATE TRIGGER trigger_notify_assignment_created
  AFTER INSERT ON assignments
  FOR EACH ROW EXECUTE FUNCTION notify_students_of_assignment();

DROP TRIGGER IF EXISTS trigger_notify_assignment_updated ON assignments;
CREATE TRIGGER trigger_notify_assignment_updated
  AFTER UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION notify_students_of_assignment();

-- Insert some sample notifications for email system activities
CREATE OR REPLACE FUNCTION create_email_sent_notifications()
RETURNS void AS $$
BEGIN
  -- This function can be called when daily emails are sent
  INSERT INTO notifications (user_id, title, message, type, metadata)
  SELECT 
    p.id,
    'Daily Assignment Email Sent',
    'Your daily assignment email has been sent to ' || p.email,
    'success',
    jsonb_build_object('action', 'email_sent', 'email', p.email)
  FROM profiles p
  WHERE p.role = 'student'
  AND p.email IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;