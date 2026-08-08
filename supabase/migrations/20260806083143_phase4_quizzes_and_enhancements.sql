/*
# Phase 4: Quiz Management System + Academic Records Enhancements

## Summary
This migration adds a complete quiz management system (Google-Forms-like) for faculty to create
quizzes with multiple question types (multiple choice single/multiple correct, short answer,
paragraph answer, true/false). Students can attempt quizzes with auto-scoring for objective
questions and manual evaluation for subjective ones. It also adds a remarks column to
academic_records for faculty remarks, and targeting columns to lab_tasks for department/
academic year/semester targeting.

## New Tables
1. `quizzes` — Quiz container with targeting fields (department, academic year, semester,
   section, subject), duration, due date, total marks, instructions, status (draft/published).
2. `quiz_questions` — Individual questions within a quiz. Supports 5 question types:
   - multiple_choice_single (radio buttons, one correct answer)
   - multiple_choice_multiple (checkboxes, multiple correct answers)
   - short_answer (text input, manually evaluated)
   - paragraph_answer (textarea, manually evaluated)
   - true_false (radio buttons, two options)
   Each question has marks, correct answer(s), optional explanation, required/optional flag,
   and optional question image URL. Options stored as jsonb array.
3. `quiz_submissions` — Student attempt records with answers (jsonb), score, status
   (in_progress/submitted/graded), auto_scored flag, time started/submitted.

## Modified Tables
1. `academic_records` — Added `remarks` text column for faculty remarks on student performance.
2. `lab_tasks` — Added `department_id`, `academic_year_id`, `semester_id` for targeting.

## Security
- RLS enabled on all new tables.
- Quizzes: authenticated SELECT; faculty INSERT/UPDATE/DELETE own quizzes.
- Quiz questions: authenticated SELECT; faculty INSERT/UPDATE/DELETE for their quizzes.
- Quiz submissions: authenticated SELECT own; students INSERT/UPDATE own; faculty UPDATE for grading.

## Notes
1. Quiz options are stored as jsonb arrays in quiz_questions.options.
2. Correct answers for multiple_choice_single: index in options array (as string).
3. Correct answers for multiple_choice_multiple: comma-separated indices.
4. Correct answers for true_false: "true" or "false".
5. Short/paragraph answers: correct_answer is null (manually graded).
6. Auto-scoring applies to multiple_choice_single, multiple_choice_multiple, true_false only.
*/

-- ===== Add remarks to academic_records =====
ALTER TABLE academic_records ADD COLUMN IF NOT EXISTS remarks text;

-- ===== Add targeting columns to lab_tasks =====
ALTER TABLE lab_tasks
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL;

-- ===== Quizzes table =====
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  faculty_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  duration_minutes int DEFAULT 30,
  due_date timestamptz,
  total_marks int DEFAULT 0,
  instructions text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_faculty ON quizzes(faculty_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_section ON quizzes(section_id);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_quizzes" ON quizzes;
CREATE POLICY "select_quizzes" ON quizzes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_quizzes" ON quizzes;
CREATE POLICY "insert_quizzes" ON quizzes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = faculty_id);

DROP POLICY IF EXISTS "update_quizzes" ON quizzes;
CREATE POLICY "update_quizzes" ON quizzes FOR UPDATE
  TO authenticated USING (auth.uid() = faculty_id)
  WITH CHECK (auth.uid() = faculty_id);

DROP POLICY IF EXISTS "delete_quizzes" ON quizzes;
CREATE POLICY "delete_quizzes" ON quizzes FOR DELETE
  TO authenticated USING (auth.uid() = faculty_id);

-- ===== Quiz Questions table =====
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice_single',
  options jsonb DEFAULT '[]'::jsonb,
  correct_answer text,
  explanation text,
  marks int DEFAULT 1,
  is_required boolean DEFAULT true,
  question_image_url text,
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_quiz_questions" ON quiz_questions;
CREATE POLICY "select_quiz_questions" ON quiz_questions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_quiz_questions" ON quiz_questions;
CREATE POLICY "insert_quiz_questions" ON quiz_questions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_id AND quizzes.faculty_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_quiz_questions" ON quiz_questions;
CREATE POLICY "update_quiz_questions" ON quiz_questions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_id AND quizzes.faculty_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_quiz_questions" ON quiz_questions;
CREATE POLICY "delete_quiz_questions" ON quiz_questions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_id AND quizzes.faculty_id = auth.uid())
  );

-- ===== Quiz Submissions table =====
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers jsonb DEFAULT '[]'::jsonb,
  score int DEFAULT 0,
  total_marks int DEFAULT 0,
  status text NOT NULL DEFAULT 'in_progress',
  auto_scored boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz ON quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student ON quiz_submissions(student_id);

ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_quiz_submissions" ON quiz_submissions;
CREATE POLICY "select_quiz_submissions" ON quiz_submissions FOR SELECT
  TO authenticated USING (auth.uid() = student_id OR auth.uid() IN (SELECT faculty_id FROM quizzes WHERE quizzes.id = quiz_id));

DROP POLICY IF EXISTS "insert_quiz_submissions" ON quiz_submissions;
CREATE POLICY "insert_quiz_submissions" ON quiz_submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "update_quiz_submissions" ON quiz_submissions;
CREATE POLICY "update_quiz_submissions" ON quiz_submissions FOR UPDATE
  TO authenticated USING (auth.uid() = student_id OR auth.uid() IN (SELECT faculty_id FROM quizzes WHERE quizzes.id = quiz_id));

DROP POLICY IF EXISTS "delete_quiz_submissions" ON quiz_submissions;
CREATE POLICY "delete_quiz_submissions" ON quiz_submissions FOR DELETE
  TO authenticated USING (auth.uid() = student_id);
