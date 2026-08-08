import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, Role } from '@/types';

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  departmentId?: string;
  employeeId?: string;
  enrollmentNumber?: string;
  rollNumber?: string;
  academicYearId?: string;
  semesterId?: string;
  sectionId?: string;
  designation?: string;
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(uid: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (error) {
      console.error('Profile load error:', error.message);
      return;
    }
    setProfile(data as Profile | null);
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      const uid = data.session?.user?.id;
      if (uid) {
        loadProfile(uid).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        const uid = newSession?.user?.id;
        if (uid) {
          await loadProfile(uid);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(data: SignUpData) {
    const metaData: Record<string, string> = { full_name: data.fullName, role: data.role };
    if (data.employeeId) metaData.employee_id = data.employeeId;
    if (data.enrollmentNumber) metaData.enrollment_number = data.enrollmentNumber;
    if (data.rollNumber) metaData.roll_number = data.rollNumber;
    if (data.designation) metaData.designation = data.designation;
    if (data.departmentId) metaData.department_id = data.departmentId;
    if (data.academicYearId) metaData.academic_year_id = data.academicYearId;
    if (data.semesterId) metaData.semester_id = data.semesterId;
    if (data.sectionId) metaData.section_id = data.sectionId;

    const { data: res, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: metaData },
    });
    if (error) return { error: error.message };
    if (res.user) {
      // Update profile with the university structure columns (the trigger creates the base row)
      const updates: Record<string, string | null> = {};
      if (data.departmentId) updates.department_id = data.departmentId;
      if (data.employeeId) updates.employee_id = data.employeeId;
      if (data.enrollmentNumber) updates.enrollment_number = data.enrollmentNumber;
      if (data.rollNumber) updates.roll_number = data.rollNumber;
      if (data.designation) updates.designation = data.designation;
      if (data.academicYearId) updates.academic_year_id = data.academicYearId;
      if (data.semesterId) updates.semester_id = data.semesterId;
      if (data.sectionId) updates.section_id = data.sectionId;
      if (Object.keys(updates).length > 0) {
        await supabase.from('profiles').update(updates).eq('id', res.user.id);
      }
      await loadProfile(res.user.id);
    }
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }

  async function refreshProfile() {
    if (session?.user?.id) await loadProfile(session.user.id);
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getHomeRoute(role: Role): string {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return '/admin';
    case 'dept_admin':
      return '/dept-admin';
    case 'faculty':
      return '/faculty';
    case 'student':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}
