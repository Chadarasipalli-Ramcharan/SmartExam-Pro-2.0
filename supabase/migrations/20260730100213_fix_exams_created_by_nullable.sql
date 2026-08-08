/*
# Fix exams.created_by constraint for cleanup

The `created_by` column is NOT NULL but references profiles with ON DELETE SET NULL,
which causes a constraint violation when deleting the admin profile. This migration
makes the column nullable so the ON DELETE SET NULL can work, allowing user cleanup.
*/

ALTER TABLE exams ALTER COLUMN created_by DROP NOT NULL;
