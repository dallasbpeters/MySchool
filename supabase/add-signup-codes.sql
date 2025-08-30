-- Create signup codes table for child registration
CREATE TABLE IF NOT EXISTS signup_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  child_name TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES auth.users ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on signup_codes
ALTER TABLE signup_codes ENABLE ROW LEVEL SECURITY;

-- Signup codes policies
CREATE POLICY "Parents can manage their signup codes" ON signup_codes
  FOR ALL USING (auth.uid() = parent_id);

CREATE POLICY "Anyone can view signup codes for registration" ON signup_codes
  FOR SELECT USING (NOT used AND expires_at > NOW());