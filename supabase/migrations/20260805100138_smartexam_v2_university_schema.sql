/*
# SmartExam Pro 2.0 — University Academic Management Schema

This migration extends the existing schema (profiles, exams, questions, results)
with the full university academic structure required by the 2.0 upgrade.

## New Tables
1. departments, academic_years, semesters, sections, subjects
2. assignments + assignment_submissions
3. lab_tasks + lab_submissions
4. materials, announcements, notifications

## Modified Tables
- profiles: new columns for university structure (department_id, employee_id,
  enrollment_number, roll_number, academic_year_id, semester_id, section_id, designation)
- profiles: role constraint extended to include super_admin, dept_admin, faculty
- exams: optional subject_id and section_id links

## Security
- RLS on all new tables with is_staff()/is_faculty()/is_student() helpers
- Students see published data; faculty/staff see all within scope
*/

-- Helper functions (must come first)
CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty','dept_admin','super_admin','admin'));
$$;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student');
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','admin','dept_admin','faculty'));
$$;

GRANT EXECUTE ON FUNCTION public.is_faculty() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_student() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, anon;

-- 1. departments (must exist before profiles ALTER)
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  hod_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_departments" ON departments;
CREATE POLICY "select_departments" ON departments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modify_departments_staff" ON departments;
CREATE POLICY "modify_departments_staff" ON departments FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Add HOD FK now that departments exists
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_hod_id_fkey;
ALTER TABLE departments ADD CONSTRAINT departments_hod_id_fkey FOREIGN KEY (hod_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. academic_years
CREATE TABLE IF NOT EXISTS academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_academic_years" ON academic_years;
CREATE POLICY "select_academic_years" ON academic_years FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modify_academic_years_staff" ON academic_years;
CREATE POLICY "modify_academic_years_staff" ON academic_years FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 3. semesters
CREATE TABLE IF NOT EXISTS semesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  start_date date,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_semesters" ON semesters;
CREATE POLICY "select_semesters" ON semesters FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modify_semesters_staff" ON semesters;
CREATE POLICY "modify_semesters_staff" ON semesters FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 4. sections
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  semester_id uuid REFERENCES semesters(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  capacity integer DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_sections" ON sections;
CREATE POLICY "select_sections" ON sections FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modify_sections_staff" ON sections;
CREATE POLICY "modify_sections_staff" ON sections FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 5. subjects
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  semester_id uuid REFERENCES semesters(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  credits integer NOT NULL DEFAULT 3,
  faculty_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_subjects" ON subjects;
CREATE POLICY "select_subjects" ON subjects FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modify_subjects_staff" ON subjects;
CREATE POLICY "modify_subjects_staff" ON subjects FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Now extend profiles with university columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enrollment_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roll_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES sections(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS designation text;

-- Update role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin','super_admin','dept_admin','faculty','student'));

-- Link exams to subjects (backward compatible — nullable)
ALTER TABLE exams ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES sections(id) ON DELETE SET NULL;

-- 6. assignments
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  max_marks integer NOT NULL DEFAULT 10,
  due_date timestamptz NOT NULL,
  instructions text,
  file_url text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_assignments" ON assignments;
CREATE POLICY "select_assignments" ON assignments FOR SELECT TO authenticated USING (
  public.is_staff() OR status = 'published'
);
DROP POLICY IF EXISTS "modify_assignments_faculty" ON assignments;
CREATE POLICY "modify_assignments_faculty" ON assignments FOR ALL TO authenticated
  USING (public.is_faculty()) WITH CHECK (public.is_faculty());

-- 7. assignment_submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_url text,
  comments text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  grade numeric(5,2),
  feedback text,
  graded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  graded_at timestamptz,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','graded','late')),
  UNIQUE (assignment_id, student_id)
);
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_assignment_submissions" ON assignment_submissions;
CREATE POLICY "select_assignment_submissions" ON assignment_submissions FOR SELECT TO authenticated USING (
  student_id = auth.uid() OR public.is_staff()
);
DROP POLICY IF EXISTS "insert_own_assignment_submission" ON assignment_submissions;
CREATE POLICY "insert_own_assignment_submission" ON assignment_submissions FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "update_own_assignment_submission" ON assignment_submissions;
CREATE POLICY "update_own_assignment_submission" ON assignment_submissions FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR public.is_staff())
  WITH CHECK (student_id = auth.uid() OR public.is_staff());

-- 8. lab_tasks
CREATE TABLE IF NOT EXISTS lab_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  max_marks integer NOT NULL DEFAULT 10,
  due_date timestamptz NOT NULL,
  instructions text,
  file_url text,
  dataset_url text,
  starter_code_url text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE lab_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_lab_tasks" ON lab_tasks;
CREATE POLICY "select_lab_tasks" ON lab_tasks FOR SELECT TO authenticated USING (
  public.is_staff() OR status = 'published'
);
DROP POLICY IF EXISTS "modify_lab_tasks_faculty" ON lab_tasks;
CREATE POLICY "modify_lab_tasks_faculty" ON lab_tasks FOR ALL TO authenticated
  USING (public.is_faculty()) WITH CHECK (public.is_faculty());

-- 9. lab_submissions
CREATE TABLE IF NOT EXISTS lab_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_task_id uuid NOT NULL REFERENCES lab_tasks(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_url text,
  github_url text,
  comments text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  grade numeric(5,2),
  feedback text,
  graded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  graded_at timestamptz,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','graded','late')),
  UNIQUE (lab_task_id, student_id)
);
ALTER TABLE lab_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_lab_submissions" ON lab_submissions;
CREATE POLICY "select_lab_submissions" ON lab_submissions FOR SELECT TO authenticated USING (
  student_id = auth.uid() OR public.is_staff()
);
DROP POLICY IF EXISTS "insert_own_lab_submission" ON lab_submissions;
CREATE POLICY "insert_own_lab_submission" ON lab_submissions FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "update_own_lab_submission" ON lab_submissions;
CREATE POLICY "update_own_lab_submission" ON lab_submissions FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR public.is_staff())
  WITH CHECK (student_id = auth.uid() OR public.is_staff());

-- 10. materials
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_type text NOT NULL DEFAULT 'pdf' CHECK (material_type IN ('pdf','ppt','docx','image','video','link')),
  file_url text,
  external_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_materials" ON materials;
CREATE POLICY "select_materials" ON materials FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modify_materials_faculty" ON materials;
CREATE POLICY "modify_materials_faculty" ON materials FOR ALL TO authenticated
  USING (public.is_faculty()) WITH CHECK (public.is_faculty());

-- 11. announcements
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  semester_id uuid REFERENCES semesters(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  target_audience text NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all','students','faculty','department','section','subject')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_announcements" ON announcements;
CREATE POLICY "select_announcements" ON announcements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modify_announcements_staff" ON announcements;
CREATE POLICY "modify_announcements_staff" ON announcements FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 12. notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('assignment','quiz','exam','lab_task','material','grade','announcement')),
  title text NOT NULL,
  message text NOT NULL,
  link_id uuid,
  link_type text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_staff());
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subjects_dept ON subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_faculty ON subjects(faculty_id);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject ON assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignment_sub_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_lab_tasks_subject ON lab_tasks(subject_id);
CREATE INDEX IF NOT EXISTS idx_lab_sub_student ON lab_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_materials_subject ON materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_announcements_dept ON announcements(department_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_dept ON profiles(department_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON departments, academic_years, semesters, sections, subjects, assignments, assignment_submissions, lab_tasks, lab_submissions, materials, announcements, notifications TO authenticated, anon;

-- updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS departments_set_updated_at ON departments;
CREATE TRIGGER departments_set_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS academic_years_set_updated_at ON academic_years;
CREATE TRIGGER academic_years_set_updated_at BEFORE UPDATE ON academic_years FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS semesters_set_updated_at ON semesters;
CREATE TRIGGER semesters_set_updated_at BEFORE UPDATE ON semesters FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS sections_set_updated_at ON sections;
CREATE TRIGGER sections_set_updated_at BEFORE UPDATE ON sections FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS subjects_set_updated_at ON subjects;
CREATE TRIGGER subjects_set_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS assignments_set_updated_at ON assignments;
CREATE TRIGGER assignments_set_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS lab_tasks_set_updated_at ON lab_tasks;
CREATE TRIGGER lab_tasks_set_updated_at BEFORE UPDATE ON lab_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS materials_set_updated_at ON materials;
CREATE TRIGGER materials_set_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS announcements_set_updated_at ON announcements;
CREATE TRIGGER announcements_set_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION set_updated_at();
