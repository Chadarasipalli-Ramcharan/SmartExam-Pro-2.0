/*
# SmartExam Pro — initial schema

1. Purpose
   Full Online Examination Management System: profiles (admin/student), exams,
   multiple-choice questions, and auto-scored results.

2. New Tables
   - `profiles` — extends auth.users with role (admin/student), full_name, phone,
     status (active/inactive). id references auth.users(id).
   - `exams` — title, description, subject, duration_minutes, total_marks,
     passing_marks, instructions, start_date, end_date, created_by (admin),
     status (draft/published).
   - `questions` — exam_id, question, options (jsonb: {A,B,C,D}), correct_option
     (A/B/C/D), marks, difficulty (easy/medium/hard), explanation.
   - `results` — student_id, exam_id, answers (jsonb array), obtained_marks,
     total_marks, percentage, grade, status (pass/fail), submitted_at.

3. Security (RLS)
   - profiles: each authenticated user reads/updates own row; admins read all.
   - exams: admins full CRUD; students SELECT published exams.
   - questions: admins full CRUD; students SELECT questions of published exams.
   - results: students read/insert own; admins read all.
   - All tables ENABLE RLS. 4 policies per table (select/insert/update/delete).
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin','student')),
  phone text,
  status boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_profiles_self_or_admin" ON profiles;
CREATE POLICY "select_profiles_self_or_admin" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- exams
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  total_marks integer NOT NULL CHECK (total_marks > 0),
  passing_marks integer NOT NULL DEFAULT 0 CHECK (passing_marks >= 0),
  instructions text,
  start_date timestamptz,
  end_date timestamptz,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_exams" ON exams;
CREATE POLICY "select_exams" ON exams FOR SELECT
  TO authenticated USING (
    status = 'published' OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "insert_exams_admin" ON exams;
CREATE POLICY "insert_exams_admin" ON exams FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "update_exams_admin" ON exams;
CREATE POLICY "update_exams_admin" ON exams FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "delete_exams_admin" ON exams;
CREATE POLICY "delete_exams_admin" ON exams FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- questions
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  marks integer NOT NULL DEFAULT 1 CHECK (marks > 0),
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_questions" ON questions;
CREATE POLICY "select_questions" ON questions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = questions.exam_id AND e.status = 'published')
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "insert_questions_admin" ON questions;
CREATE POLICY "insert_questions_admin" ON questions FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "update_questions_admin" ON questions;
CREATE POLICY "update_questions_admin" ON questions FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "delete_questions_admin" ON questions;
CREATE POLICY "delete_questions_admin" ON questions FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- results
CREATE TABLE IF NOT EXISTS results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  obtained_marks integer NOT NULL DEFAULT 0,
  total_marks integer NOT NULL DEFAULT 0,
  percentage numeric(5,2) NOT NULL DEFAULT 0,
  grade text NOT NULL DEFAULT 'F',
  status text NOT NULL DEFAULT 'fail' CHECK (status IN ('pass','fail')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, exam_id)
);
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_results" ON results;
CREATE POLICY "select_results" ON results FOR SELECT
  TO authenticated USING (
    student_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "insert_own_result" ON results;
CREATE POLICY "insert_own_result" ON results FOR INSERT
  TO authenticated WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "update_own_result" ON results;
CREATE POLICY "update_own_result" ON results FOR UPDATE
  TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "delete_results_admin" ON results;
CREATE POLICY "delete_results_admin" ON results FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- indexes
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_exam_id ON results(exam_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS exams_set_updated_at ON exams;
CREATE TRIGGER exams_set_updated_at BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), COALESCE(NEW.raw_user_meta_data->>'role', 'student'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();