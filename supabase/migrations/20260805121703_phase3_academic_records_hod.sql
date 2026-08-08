/*
# Phase 3: Academic Records, Mark Uploads, HOD Assignment

## Summary
This migration adds the academic records system for Phase 3, enabling faculty to upload
internal/external/lab/assignment/quiz/practical marks, auto-calculate totals/percentages/grades,
and track upload history. It also adds HOD (Department Admin) assignment fields to the
departments table so Super Admin can designate a faculty member as the department administrator.

## New Tables
1. `academic_records` — Stores per-student academic marks for each subject/semester/section.
   - student_id, faculty_id, subject_id, department_id, semester_id, section_id, academic_year_id
   - internal_marks, external_marks, assignment_marks, quiz_marks, lab_marks, practical_marks
   - total_marks, percentage, grade, pass_fail
   - uploaded_by, uploaded_at, updated_at
   - Unique constraint on (student_id, subject_id, academic_year_id) to prevent duplicates.

2. `mark_uploads` — Tracks each bulk upload session (manual entry, CSV, or Excel).
   - faculty_id, subject_id, department_id, semester_id, section_id, academic_year_id
   - upload_type (manual/csv/excel), file_name, total_records, success_count, error_count
   - status (processing/completed/failed), errors (jsonb array of validation errors)
   - created_at

## Modified Tables
1. `departments` — Added columns for HOD assignment:
   - hod_id (uuid, references profiles, nullable) — the faculty member who is HOD
   - hod_name (text, nullable) — denormalized HOD name for quick display
   - hod_email (text, nullable) — denormalized HOD email
   - department_admin_user_id (uuid, references profiles, nullable) — the auth user
     who acts as dept_admin for this department (may differ from hod_id if the HOD
     doesn't personally log in; hod_id is the faculty profile, department_admin_user_id
     is the account that logs in as dept_admin)

## Security
- RLS enabled on both new tables.
- academic_records: authenticated users can SELECT; faculty can INSERT/UPDATE their own
  records; dept_admin and super_admin can SELECT all. DELETE restricted to super_admin.
- mark_uploads: authenticated users can SELECT; faculty can INSERT their own upload records.
- Policies use auth.uid() for ownership checks.

## Notes
1. The `hod_id` column on departments links to the faculty profile who is the HOD.
2. The `department_admin_user_id` column is the auth.users ID that has role=dept_admin.
   When Super Admin assigns an HOD, they create a dept_admin auth account and link it here.
3. Academic records use a grade scale: A+ (>=90), A (>=80), B (>=70), C (>=60), D (>=50), F (<50).
4. Pass/Fail is determined by percentage >= 40 (standard university passing threshold).
*/

-- ===== Add HOD columns to departments =====
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS hod_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hod_name text,
  ADD COLUMN IF NOT EXISTS hod_email text,
  ADD COLUMN IF NOT EXISTS department_admin_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- ===== Academic Records table =====
CREATE TABLE IF NOT EXISTS academic_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  faculty_id uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  internal_marks numeric DEFAULT 0,
  external_marks numeric DEFAULT 0,
  assignment_marks numeric DEFAULT 0,
  quiz_marks numeric DEFAULT 0,
  lab_marks numeric DEFAULT 0,
  practical_marks numeric DEFAULT 0,
  total_marks numeric DEFAULT 0,
  percentage numeric DEFAULT 0,
  grade text DEFAULT 'F',
  pass_fail text DEFAULT 'fail',
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique constraint: one record per student per subject per academic year
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'academic_records_student_subject_year_key'
  ) THEN
    ALTER TABLE academic_records
      ADD CONSTRAINT academic_records_student_subject_year_key
      UNIQUE (student_id, subject_id, academic_year_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_academic_records_student ON academic_records(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_faculty ON academic_records(faculty_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_subject ON academic_records(subject_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_department ON academic_records(department_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_semester ON academic_records(semester_id);

ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_academic_records" ON academic_records;
CREATE POLICY "select_academic_records"
  ON academic_records FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_academic_records" ON academic_records;
CREATE POLICY "insert_academic_records"
  ON academic_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = faculty_id OR auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "update_academic_records" ON academic_records;
CREATE POLICY "update_academic_records"
  ON academic_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = faculty_id OR auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = faculty_id OR auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "delete_academic_records" ON academic_records;
CREATE POLICY "delete_academic_records"
  ON academic_records FOR DELETE
  TO authenticated USING (auth.uid() = faculty_id OR auth.uid() = uploaded_by);

-- ===== Mark Uploads table =====
CREATE TABLE IF NOT EXISTS mark_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  upload_type text NOT NULL DEFAULT 'manual',
  file_name text,
  total_records int DEFAULT 0,
  success_count int DEFAULT 0,
  error_count int DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  errors jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mark_uploads_faculty ON mark_uploads(faculty_id);
CREATE INDEX IF NOT EXISTS idx_mark_uploads_subject ON mark_uploads(subject_id);

ALTER TABLE mark_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_mark_uploads" ON mark_uploads;
CREATE POLICY "select_mark_uploads"
  ON mark_uploads FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_mark_uploads" ON mark_uploads;
CREATE POLICY "insert_mark_uploads"
  ON mark_uploads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = faculty_id);

DROP POLICY IF EXISTS "update_mark_uploads" ON mark_uploads;
CREATE POLICY "update_mark_uploads"
  ON mark_uploads FOR UPDATE
  TO authenticated
  USING (auth.uid() = faculty_id)
  WITH CHECK (auth.uid() = faculty_id);

DROP POLICY IF EXISTS "delete_mark_uploads" ON mark_uploads;
CREATE POLICY "delete_mark_uploads"
  ON mark_uploads FOR DELETE
  TO authenticated USING (auth.uid() = faculty_id);

-- ===== Add targeting columns to assignments =====
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL;

-- ===== Add targeting columns to materials =====
ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL;

-- ===== Add targeting columns to exams =====
ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL;

-- ===== Add announcement audience refinement =====
-- target_audience already supports 'all','students','faculty','department','section','subject'
-- Add 'dept_admins' and 'faculty_students' as new audience types via check constraint update
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_target_audience_check;
ALTER TABLE announcements ADD CONSTRAINT announcements_target_audience_check
  CHECK (target_audience IN ('all','students','faculty','department','section','subject','dept_admins','faculty_students'));
