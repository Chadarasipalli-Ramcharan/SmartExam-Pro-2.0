import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  GraduationCap, LayoutDashboard, Users, FileText, HelpCircle, BarChart3,
  ClipboardList, User, LogOut, Menu, X, Sun, Moon, BookOpen, Award,
  Building2, CalendarDays, Layers, Megaphone, FlaskConical, FolderOpen, Search, Bell,
  Vote, FileQuestion,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LoadingScreen } from '@/components/Loading';

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean };

const superAdminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/academic-years', label: 'Academic Years', icon: CalendarDays },
  { to: '/admin/semesters', label: 'Semesters', icon: Layers },
  { to: '/admin/sections', label: 'Sections', icon: Users },
  { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/faculty', label: 'Faculty', icon: User },
  { to: '/admin/polls', label: 'Polls', icon: Vote },
  { to: '/admin/poll-results', label: 'Poll Results', icon: BarChart3 },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/academic-records', label: 'Academic Records', icon: GraduationCap },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

const deptAdminNav: NavItem[] = [
  { to: '/dept-admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dept-admin/faculty', label: 'Faculty', icon: User },
  { to: '/dept-admin/students', label: 'Students', icon: Users },
  { to: '/dept-admin/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/dept-admin/sections', label: 'Sections', icon: Users },
  { to: '/dept-admin/polls', label: 'Polls', icon: Vote },
  { to: '/dept-admin/academic-records', label: 'Academic Records', icon: GraduationCap },
  { to: '/dept-admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/dept-admin/analytics', label: 'Analytics', icon: BarChart3 },
];

const facultyNav: NavItem[] = [
  { to: '/faculty', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/faculty/subjects', label: 'My Subjects', icon: BookOpen },
  { to: '/faculty/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/faculty/lab-tasks', label: 'Lab Tasks', icon: FlaskConical },
  { to: '/faculty/materials', label: 'Materials', icon: FolderOpen },
  { to: '/faculty/quizzes', label: 'Quizzes', icon: FileQuestion },
  { to: '/faculty/results', label: 'Results', icon: BarChart3 },
  { to: '/faculty/academic-records', label: 'Academic Records', icon: GraduationCap },
  { to: '/faculty/polls', label: 'Polls', icon: Vote },
  { to: '/faculty/announcements', label: 'Announcements', icon: Megaphone },
];

const studentNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/subjects', label: 'My Subjects', icon: BookOpen },
  { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/student/lab-tasks', label: 'Lab Tasks', icon: FlaskConical },
  { to: '/student/materials', label: 'Materials', icon: FolderOpen },
  { to: '/student/quizzes', label: 'Quizzes', icon: FileQuestion },
  { to: '/student/academic-records', label: 'Academic Records', icon: GraduationCap },
  { to: '/student/polls', label: 'Polls', icon: Vote },
  { to: '/student/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/profile', label: 'Profile', icon: User },
];

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return superAdminNav;
    case 'dept_admin':
      return deptAdminNav;
    case 'faculty':
      return facultyNav;
    case 'student':
      return studentNav;
    default:
      return studentNav;
  }
}

export function DashboardLayout() {
  const { profile, signOut, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <LoadingScreen />;
  if (!profile) return <Navigate to="/login" replace />;

  const navItems = getNavItems(profile.role);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">SmartExam</p>
            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">Pro 2.0</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{profile.full_name}</p>
              <p className="text-xs text-slate-400 capitalize">{profile.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm text-slate-400">
              Welcome back, <span className="font-semibold text-slate-700 dark:text-slate-200">{profile.full_name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/search')} className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Search">
              <Search className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/notifications')} className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={toggleTheme} className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Toggle theme">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <button onClick={() => setSidebarOpen(false)} className="fixed top-4 right-4 z-50 lg:hidden p-2 rounded-lg bg-white dark:bg-slate-800 shadow-lg">
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
