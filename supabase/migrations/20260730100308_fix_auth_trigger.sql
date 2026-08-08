/*
# Fix handle_new_user trigger function

The trigger function that auto-creates a profile on signup was failing with
"Database error saving new user". This rebuilds the function with an explicit
search_path and grants proper permissions, so the SECURITY DEFINER function
can insert into the profiles table during the auth signup flow.
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Rebuild the function with explicit search_path for security and reliability
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.results TO authenticated, anon;
