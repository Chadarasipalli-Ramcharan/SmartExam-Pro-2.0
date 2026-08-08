-- Populate semesters and sections for ALL departments so registration dropdowns are never empty.
-- CSE already has 8 semesters but only Semester 1 has sections; other departments have none.

DO $$
DECLARE
  dept RECORD;
  sem_id UUID;
  i INT;
  sem_name TEXT;
  ay_first UUID;
BEGIN
  SELECT id INTO ay_first FROM academic_years WHERE name = 'First Year' LIMIT 1;

  FOR dept IN SELECT id FROM departments ORDER BY code LOOP
    FOR i IN 1..8 LOOP
      sem_name := 'Semester ' || i;

      -- Insert semester if it doesn't exist for this department
      INSERT INTO semesters (name, department_id, academic_year_id, is_active, created_at, updated_at)
      VALUES (sem_name, dept.id, ay_first, i = 1, now(), now())
      ON CONFLICT DO NOTHING
      RETURNING id INTO sem_id;

      -- If INSERT didn't return (already existed), fetch it
      IF sem_id IS NULL THEN
        SELECT id INTO sem_id FROM semesters
        WHERE department_id = dept.id AND name = sem_name
        LIMIT 1;
      END IF;

      -- Create sections A and B for this semester if they don't exist
      IF sem_id IS NOT NULL THEN
        INSERT INTO sections (name, semester_id, department_id, academic_year_id, capacity, created_at, updated_at)
        VALUES ('A', sem_id, dept.id, ay_first, 60, now(), now())
        ON CONFLICT DO NOTHING;

        INSERT INTO sections (name, semester_id, department_id, academic_year_id, capacity, created_at, updated_at)
        VALUES ('B', sem_id, dept.id, ay_first, 60, now(), now())
        ON CONFLICT DO NOTHING;
      END IF;

      sem_id := NULL;
    END LOOP;
  END LOOP;
END $$;

-- Verify counts
-- Should be: 6 departments × 8 semesters = 48 semesters, 48 × 2 sections = 96 sections
