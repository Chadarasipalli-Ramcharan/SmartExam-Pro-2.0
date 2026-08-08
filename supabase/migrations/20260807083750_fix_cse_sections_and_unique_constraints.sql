-- Add missing sections for CSE semesters 2-8 (Semester 1 already has A & B)
-- Also add a unique constraint to prevent duplicate semesters per department

-- First, add unique constraint on semesters (department_id, name)
CREATE UNIQUE INDEX IF NOT EXISTS semesters_dept_name_unique
  ON semesters (department_id, name);

-- Add unique constraint on sections (semester_id, name)
CREATE UNIQUE INDEX IF NOT EXISTS sections_sem_name_unique
  ON sections (semester_id, name);

-- Add sections A and B for CSE semesters 2-8
DO $$
DECLARE
  sem RECORD;
BEGIN
  FOR sem IN
    SELECT id FROM semesters
    WHERE department_id = '7df01df4-2229-448f-b8fc-e4e636d4470c'
    AND name != 'Semester 1'
  LOOP
    INSERT INTO sections (name, semester_id, department_id, academic_year_id, capacity, created_at, updated_at)
    VALUES ('A', sem.id, '7df01df4-2229-448f-b8fc-e4e636d4470c', 'ee781f34-9f37-4eba-a36c-9bf2aeccff9d', 60, now(), now())
    ON CONFLICT (semester_id, name) DO NOTHING;

    INSERT INTO sections (name, semester_id, department_id, academic_year_id, capacity, created_at, updated_at)
    VALUES ('B', sem.id, '7df01df4-2229-448f-b8fc-e4e636d4470c', 'ee781f34-9f37-4eba-a36c-9bf2aeccff9d', 60, now(), now())
    ON CONFLICT (semester_id, name) DO NOTHING;
  END LOOP;
END $$;
