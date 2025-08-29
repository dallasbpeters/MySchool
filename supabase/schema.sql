-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('parent', 'student')) DEFAULT 'student',
  parent_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create assignments table
CREATE TABLE assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content JSONB, -- Rich text content from WYSIWYG editor
  links JSONB, -- Array of links
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create student_assignments table for tracking completion
CREATE TABLE student_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(assignment_id, student_id)
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Parents can view their students" ON profiles
  FOR SELECT USING (
    auth.uid() = parent_id OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'parent'
  );

-- Assignments policies
CREATE POLICY "Parents can create assignments" ON assignments
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can view their own assignments" ON assignments
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Students can view assignments from their parent" ON assignments
  FOR SELECT USING (
    parent_id = (SELECT parent_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Parents can update their own assignments" ON assignments
  FOR UPDATE USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their own assignments" ON assignments
  FOR DELETE USING (auth.uid() = parent_id);

-- Student assignments policies
CREATE POLICY "Students can view their own assignments" ON student_assignments
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own assignment status" ON student_assignments
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Parents can view their students' assignment status" ON student_assignments
  FOR SELECT USING (
    student_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
  );

CREATE POLICY "System can create student assignments" ON student_assignments
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM profiles 
      WHERE parent_id = (
        SELECT parent_id FROM assignments WHERE id = assignment_id
      )
    )
  );

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();