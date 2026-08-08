/*
# Fix recursive RLS policies

All role-checking policies used `EXISTS (SELECT 1 FROM profiles ...)` subqueries
on the profiles table, which is itself subject to RLS — creating infinite
recursion. Every profile query silently failed, so the frontend could never
load the user's role and redirects after login never fired.

This migration:
1. Creates an is_admin() SECURITY DEFINER function that bypasses RLS to safely
   check whether the current user is an admin.
2. Rewrites every policy that referenced profiles in a subquery to use is_admin()
   instead, eliminating the recursion.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- profiles: rewrite SELECT policy
DROP POLICY IF EXISTS "select_profiles_self_or_admin" ON profiles;
CREATE POLICY "select_profiles_self_or_admin" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

-- exams: rewrite SELECT policy
DROP POLICY IF EXISTS "select_exams" ON exams;
CREATE POLICY "select_exams" ON exams FOR SELECT
  TO authenticated USING (
    status = 'published' OR public.is_admin()
  );

-- exams: rewrite INSERT policy
DROP POLICY IF EXISTS "insert_exams_admin" ON exams;
CREATE POLICY "insert_exams_admin" ON exams FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- exams: rewrite UPDATE policy
DROP POLICY IF EXISTS "update_exams_admin" ON exams;
CREATE POLICY "update_exams_admin" ON exams FOR UPDATE
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- exams: rewrite DELETE policy
DROP POLICY IF EXISTS "delete_exams_admin" ON exams;
CREATE POLICY "delete_exams_admin" ON exams FOR DELETE
  TO authenticated USING (public.is_admin());

-- questions: rewrite SELECT policy
DROP POLICY IF EXISTS "select_questions" ON questions;
CREATE POLICY "select_questions" ON questions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = questions.exam_id AND e.status = 'published')
    OR public.is_admin()
  );

-- questions: rewrite INSERT policy
DROP POLICY IF EXISTS "insert_questions_admin" ON questions;
CREATE POLICY "insert_questions_admin" ON questions FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- questions: rewrite UPDATE policy
DROP POLICY IF EXISTS "update_questions_admin" ON questions;
CREATE POLICY "update_questions_admin" ON questions FOR UPDATE
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- questions: rewrite DELETE policy
DROP POLICY IF EXISTS "delete_questions_admin" ON questions;
CREATE POLICY "delete_questions_admin" ON questions FOR DELETE
  TO authenticated USING (public.is_admin());

-- results: rewrite SELECT policy
DROP POLICY IF EXISTS "select_results" ON results;
CREATE POLICY "select_results" ON results FOR SELECT
  TO authenticated USING (
    student_id = auth.uid() OR public.is_admin()
  );

-- results: rewrite DELETE policy
DROP POLICY IF EXISTS "delete_results_admin" ON results;
CREATE POLICY "delete_results_admin" ON results FOR DELETE
  TO authenticated USING (public.is_admin());
