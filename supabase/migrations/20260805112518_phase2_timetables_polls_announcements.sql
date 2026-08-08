/*
# Phase 2 — Timetables, Polls, Announcement enhancements

## New Tables
1. timetables — weekly class schedule entries linked to department, semester, section, subject, faculty
2. polls — poll questions with type (single/multiple/yesno), target audience, status
3. poll_options — choices for each poll
4. poll_votes — individual votes by users (one per user per poll)

## Modified Tables
- announcements: add file_attachment_url, expiry_date columns
- sections: add class_advisor_id, academic_year_id columns
*/

-- 1. timetables
CREATE TABLE IF NOT EXISTS timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE CASCADE,
  semester_id uuid REFERENCES semesters(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  faculty_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_timetables" ON timetables;
CREATE POLICY "select_timetables" ON timetables FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modify_timetables_staff" ON timetables;
CREATE POLICY "modify_timetables_staff" ON timetables FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 2. polls
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  poll_type text NOT NULL DEFAULT 'single' CHECK (poll_type IN ('single','multiple','yesno')),
  target_audience text NOT NULL DEFAULT 'both' CHECK (target_audience IN ('students','faculty','both')),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE CASCADE,
  semester_id uuid REFERENCES semesters(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  is_anonymous boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed')),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_polls" ON polls;
CREATE POLICY "select_polls" ON polls FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modify_polls_staff" ON polls;
CREATE POLICY "modify_polls_staff" ON polls FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 3. poll_options
CREATE TABLE IF NOT EXISTS poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_poll_options" ON poll_options;
CREATE POLICY "select_poll_options" ON poll_options FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modify_poll_options_staff" ON poll_options;
CREATE POLICY "modify_poll_options_staff" ON poll_options FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 4. poll_votes
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id, option_id)
);
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_poll_votes" ON poll_votes;
CREATE POLICY "select_poll_votes" ON poll_votes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_poll_vote" ON poll_votes;
CREATE POLICY "insert_own_poll_vote" ON poll_votes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_own_poll_vote" ON poll_votes;
CREATE POLICY "delete_own_poll_vote" ON poll_votes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Add a unique constraint to prevent multiple votes on different options for single/yesno polls
CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_vote_single ON poll_votes(poll_id, user_id);

-- Announcement enhancements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS file_attachment_url text;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expiry_date date;

-- Section enhancements
ALTER TABLE sections ADD COLUMN IF NOT EXISTS class_advisor_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timetables_dept ON timetables(department_id);
CREATE INDEX IF NOT EXISTS idx_timetables_section ON timetables(section_id);
CREATE INDEX IF NOT EXISTS idx_polls_dept ON polls(department_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes(user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON timetables, polls, poll_options, poll_votes TO authenticated, anon;

-- Triggers
DROP TRIGGER IF EXISTS timetables_set_updated_at ON timetables;
CREATE TRIGGER timetables_set_updated_at BEFORE UPDATE ON timetables FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS polls_set_updated_at ON polls;
CREATE TRIGGER polls_set_updated_at BEFORE UPDATE ON polls FOR EACH ROW EXECUTE FUNCTION set_updated_at();
