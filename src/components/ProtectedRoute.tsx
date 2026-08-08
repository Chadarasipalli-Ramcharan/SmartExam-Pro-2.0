import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/Loading';
import type { Role } from '@/types';

interface Props {
  children: ReactNode;
  roles?: Role[];
}

export function ProtectedRoute({ children, roles }: Props) {
  const { session, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (roles && !profile) return <LoadingScreen />;
  if (roles && profile && !roles.includes(profile.role)) {
    const home = profile.role === 'student' ? '/dashboard' : profile.role === 'faculty' ? '/faculty' : '/admin';
    return <Navigate to={home} replace />;
  }
  return <>{children}</>;
}
