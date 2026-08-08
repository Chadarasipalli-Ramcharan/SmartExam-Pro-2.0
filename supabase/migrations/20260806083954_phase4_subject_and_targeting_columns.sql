-- Add room_number to subjects for classroom display
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS room_number text;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Add targeting columns to assignments and materials
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL;

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES sections(id) ON DELETE SET NULL;

-- Add attachment_url to assignments and lab_tasks for file attachments
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE lab_tasks ADD COLUMN IF NOT EXISTS attachment_url text;
