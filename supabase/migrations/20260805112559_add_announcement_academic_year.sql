ALTER TABLE announcements ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL;
