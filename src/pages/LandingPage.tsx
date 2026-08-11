import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  GraduationCap,
  BarChart3,
  ShieldCheck,
  Users,
  BookOpen,
  Zap,
  ArrowRight,
  Megaphone,
  FolderOpen,
  ClipboardList,
  CheckCircle2,
  Sparkles,
  Layers3,
  Clock3,
  Globe2,
  ChevronRight,
  Bell,
  Search,
  CalendarDays,
  TrendingUp,
  FileText,
  Award,
  Menu,
  MoreHorizontal,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

type Stat = {
  icon: LucideIcon;
  value: string;
  label: string;
};

export function LandingPage() {
  const { session } = useAuth();

  const features: Feature[] = [
    {
      icon: BookOpen,
      title: 'Smart Subject Management',
      desc: 'Organize departments, semesters, sections, subjects, faculty assignments, and academic credits from one centralized workspace.',
    },
    {
      icon: ClipboardList,
      title: 'Assignments & Labs',
      desc: 'Create assignments and practical tasks, collect submissions, track deadlines, and grade student work efficiently.',
    },
    {
      icon: Zap,
      title: 'Interactive Polls',
      desc: 'Create real-time polls and surveys for students and faculty with audience targeting and response analytics.',
    },
    {
      icon: BarChart3,
      title: 'Academic Analytics',
      desc: 'Transform academic activity into meaningful insights through dashboards, performance metrics, and reporting.',
    },
    {
      icon: Megaphone,
      title: 'Announcements',
      desc: 'Deliver important academic announcements to departments, sections, subjects, or the entire institution.',
    },
    {
      icon: FolderOpen,
      title: 'Digital Materials',
      desc: 'Keep PDFs, presentations, videos, links, and study resources organized by subject and easily accessible.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Role Access',
      desc: 'Powerful role-based permissions ensure administrators, faculty, and students see only what they need.',
    },
    {
      icon: Layers3,
      title: 'Unified Academic Hub',
      desc: 'Bring the institution’s academic workflow together instead of managing disconnected systems.',
    },
  ];

  const stats: Stat[] = [
    {
      icon: Users,
      value: '4',
      label: 'User Roles',
    },
    {
      icon: Layers3,
      value: '8+',
      label: 'Academic Modules',
    },
    {
      icon: BarChart3,
      value: '100%',
      label: 'Centralized Data',
    },
    {
      icon: Globe2,
      value: '24/7',
      label: 'Accessible',
    },
  ];

  const dashboardStats = [
    {
      label: 'Total Students',
      value: '2,486',
      change: '+12.5%',
      icon: Users,
      iconClass: 'bg-blue-500/15 text-blue-400',
    },
    {
      label: 'Faculty Members',
      value: '148',
      change: '+8.2%',
      icon: GraduationCap,
      iconClass: 'bg-violet-500/15 text-violet-400',
    },
    {
      label: 'Active Courses',
      value: '86',
      change: '+14.1%',
      icon: BookOpen,
      iconClass: 'bg-emerald-500/15 text-emerald-400',
    },
    {
      label: 'Submissions',
      value: '1,294',
      change: '+18.6%',
      icon: FileText,
      iconClass: 'bg-orange-500/15 text-orange-400',
    },
  ];

  const activityItems = [
    {
      title: 'Assignment submitted',
      subtitle: 'Database Management Systems',
      time: '2 min ago',
      icon: FileText,
      iconClass: 'bg-blue-500/15 text-blue-400',
    },
    {
      title: 'New announcement posted',
      subtitle: 'Computer Science Department',
      time: '18 min ago',
      icon: Megaphone,
      iconClass: 'bg-violet-500/15 text-violet-400',
    },
    {
      title: 'Quiz results published',
      subtitle: 'Artificial Intelligence',
      time: '1 hr ago',
      icon: Award,
      iconClass: 'bg-emerald-500/15 text-emerald-400',
    },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-950 text-white">
      {/* =========================================================
          NAVBAR
      ========================================================= */}

      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto mt-3 max-w-7xl px-3 sm:px-6 lg:px-8">
          <nav className="flex h-16 items-center justify-between rounded-2xl border border-white/15 bg-slate-950/45 px-3 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:px-4">
            <Link
              to="/"
              className="flex min-w-0 items-center gap-2 sm:gap-3"
            >
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-sky-400 shadow-lg shadow-blue-500/30 sm:h-10 sm:w-10">
                <GraduationCap className="h-5 w-5 text-white" />

                <div className="absolute -inset-1 -z-10 rounded-xl bg-blue-500/30 blur-md" />
              </div>

              <div className="min-w-0">
                <div className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
                  SmartExam{' '}
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Pro
                  </span>
                </div>

                <div className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 sm:block">
                  Academic Intelligence
                </div>
              </div>
            </Link>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              {session ? (
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:px-4 sm:text-sm"
                >
                  <span>Dashboard</span>

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:block"
                  >
                    Sign in
                  </Link>

                  <Link
                    to="/register"
                    className="group inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:gap-2 sm:px-4 sm:text-sm"
                  >
                    <span>Get Started</span>

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* =========================================================
          MAIN
      ========================================================= */}

      <main>
        {/* =========================================================
            HERO
        ========================================================= */}

        <section className="relative min-h-[820px] overflow-hidden pt-24 sm:min-h-[900px] sm:pt-32">
          {/* =====================================================
              REAL IMAGE BACKGROUND
          ===================================================== */}

          <div
            className="absolute inset-0 scale-[1.18] -translate-x-8 -translate-y-32 bg-cover bg-center sm:scale-110 sm:-translate-x-14 sm:-translate-y-52 lg:-translate-x-20 lg:-translate-y-72"
            style={{
              backgroundImage: "url('/images/1 (1).jpg')",
            }}
          />

          {/* Dark overlay */}

          <div className="absolute inset-0 bg-slate-950/85" />

          {/* Image grid */}

          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:50px_50px]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl text-center">
              {/* Badge */}

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-blue-200 shadow-2xl backdrop-blur-xl sm:mb-7 sm:px-4 sm:text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />

                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                </span>

                <Sparkles className="h-4 w-4 text-cyan-300" />

                Intelligent Academic Ecosystem
              </div>

              {/* =================================================
                  MAIN HEADING
              ================================================= */}

              <h1 className="px-2 text-3xl leading-[1.08] tracking-tight sm:text-5xl lg:px-0 lg:text-7xl">
                <span className="block font-display font-normal text-white drop-shadow-2xl">
                  One platform.
                </span>

                <span className="mt-2 block px-1 font-sans text-3xl font-extrabold tracking-[-0.035em] sm:text-5xl lg:px-0 lg:text-7xl">
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
                    Your entire university.
                  </span>
                </span>
              </h1>

              {/* Description */}

              <p className="mx-auto mt-5 max-w-3xl px-4 text-sm leading-6 text-slate-200/85 sm:mt-7 sm:px-0 sm:text-lg sm:leading-8">
                A smarter way to run modern education — bringing teaching,
                learning, assessment, collaboration, and academic operations
                together in one connected experience.
              </p>

              {/* CTA */}

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-9 sm:flex-row">
                <Link
                  to="/register"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-2xl shadow-blue-500/30 transition duration-300 hover:-translate-y-1 hover:shadow-cyan-500/30 sm:w-auto sm:px-7 sm:py-3.5 sm:text-base"
                >
                  Start for Free

                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/login"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold text-white shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/15 sm:w-auto sm:px-7 sm:py-3.5 sm:text-base"
                >
                  Explore Platform

                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Trust */}

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-xs font-medium text-slate-300 sm:mt-8 sm:gap-x-7">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Built for universities
                </span>

                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  Role-based access
                </span>

                <span className="flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-cyan-400" />
                  Real-time data
                </span>
              </div>
            </div>

            {/* =====================================================
                IMPROVED DASHBOARD PREVIEW
            ===================================================== */}

            <div className="relative mx-auto mt-10 w-full max-w-6xl sm:mt-16">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-blue-500/30 via-cyan-400/20 to-purple-500/30 blur-3xl" />

              <div className="relative w-full rounded-2xl border border-white/15 bg-white/10 p-1 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:rounded-[2rem] sm:p-2">
                <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 sm:rounded-[1.5rem]">
                  {/* Browser bar */}

                  <div className="flex h-10 items-center gap-1.5 border-b border-white/10 bg-slate-950 px-3 sm:h-11 sm:gap-2 sm:px-4">
                    <span className="h-2 w-2 rounded-full bg-red-400/70 sm:h-2.5 sm:w-2.5" />

                    <span className="h-2 w-2 rounded-full bg-yellow-400/70 sm:h-2.5 sm:w-2.5" />

                    <span className="h-2 w-2 rounded-full bg-green-400/70 sm:h-2.5 sm:w-2.5" />

                    <div className="mx-auto hidden h-6 w-1/2 rounded-md border border-white/5 bg-white/[0.04] sm:flex sm:items-center sm:px-3">
                      <span className="text-[8px] text-slate-600">
                        smartexampro.edu/dashboard
                      </span>
                    </div>

                    <div className="ml-auto flex items-center gap-2 text-slate-500 sm:hidden">
                      <Search className="h-3.5 w-3.5" />

                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Main dashboard */}

                  <div className="grid min-h-[390px] w-full grid-cols-12 bg-slate-950 sm:min-h-[500px]">
                    {/* Desktop Sidebar */}

                    <div className="col-span-3 hidden border-r border-white/10 bg-white/[0.025] p-4 md:block lg:p-5">
                      <div className="mb-7 flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
                          <GraduationCap className="h-4 w-4 text-white" />
                        </div>

                        <div>
                          <p className="text-xs font-bold text-white">
                            SmartExam Pro
                          </p>

                          <p className="text-[9px] text-slate-500">
                            Academic Portal
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {[
                          ['Overview', true],
                          ['Students', false],
                          ['Faculty', false],
                          ['Subjects', false],
                          ['Assignments', false],
                          ['Analytics', false],
                        ].map(([item, active]) => (
                          <div
                            key={String(item)}
                            className={`flex h-9 items-center rounded-lg px-3 text-[10px] font-medium ${
                              active
                                ? 'border border-blue-400/10 bg-blue-500/15 text-blue-300'
                                : 'text-slate-500'
                            }`}
                          >
                            {item}
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-3">
                        <p className="text-[9px] font-semibold text-slate-300">
                          System Status
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />

                          <span className="text-[9px] text-emerald-300">
                            All systems operational
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dashboard Content */}

                    <div className="col-span-12 min-w-0 overflow-hidden p-2.5 sm:p-5 md:col-span-9 md:p-6 lg:p-7">
                      {/* Mobile top bar */}

                      <div className="mb-4 flex items-center justify-between md:hidden">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300"
                            aria-label="Open menu"
                          >
                            <Menu className="h-4 w-4" />
                          </button>

                          <div>
                            <p className="text-[11px] font-bold text-white">
                              SmartExam Pro
                            </p>

                            <p className="text-[8px] text-slate-500">
                              University Dashboard
                            </p>
                          </div>
                        </div>

                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-[9px] font-bold text-white">
                          RA
                        </div>
                      </div>

                      {/* Header */}

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-medium text-blue-400 sm:text-[10px]">
                            UNIVERSITY OVERVIEW
                          </p>

                          <h3 className="mt-1 text-sm font-bold text-white sm:text-xl">
                            Good morning, Admin
                          </h3>

                          <p className="mt-1 hidden text-[10px] text-slate-500 sm:block">
                            Here&apos;s what&apos;s happening across your
                            institution today.
                          </p>
                        </div>

                        <div className="hidden items-center gap-3 sm:flex">
                          <button
                            type="button"
                            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400"
                            aria-label="Notifications"
                          >
                            <Bell className="h-4 w-4" />

                            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                          </button>

                          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-[8px] font-bold">
                              RA
                            </div>

                            <div className="hidden lg:block">
                              <p className="text-[9px] font-semibold text-white">
                                Ramcharan
                              </p>

                              <p className="text-[8px] text-slate-500">
                                Super Admin
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Cards */}

                      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 lg:grid-cols-4">
                        {dashboardStats.map((stat) => {
                          const Icon = stat.icon;

                          return (
                            <div
                              key={stat.label}
                              className="min-w-0 rounded-xl border border-white/10 bg-white/[0.035] p-2.5 sm:p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${stat.iconClass}`}
                                >
                                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </div>

                                <span className="hidden text-[8px] font-semibold text-emerald-400 sm:block">
                                  {stat.change}
                                </span>
                              </div>

                              <p className="mt-3 text-lg font-black tracking-tight text-white sm:text-xl">
                                {stat.value}
                              </p>

                              <p className="mt-0.5 truncate text-[8px] font-medium text-slate-500 sm:text-[9px]">
                                {stat.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Analytics and Activity */}

                      <div className="mt-4 grid gap-4 lg:grid-cols-5">
                        {/* Chart */}

                        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 sm:p-5 lg:col-span-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-[11px] font-bold text-white sm:text-sm">
                                Academic Activity
                              </h4>

                              <p className="mt-1 text-[8px] text-slate-500 sm:text-[9px]">
                                Student engagement this semester
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[8px] text-slate-400">
                              <CalendarDays className="h-3 w-3" />

                              <span className="hidden sm:inline">
                                This week
                              </span>

                              <span className="sm:hidden">Week</span>
                            </div>
                          </div>

                          <div className="mt-5 flex h-24 items-end justify-between gap-1 border-b border-white/5 pb-1 sm:h-36 sm:gap-2">
                            {[
                              { height: 48, label: 'Mon' },
                              { height: 65, label: 'Tue' },
                              { height: 42, label: 'Wed' },
                              { height: 82, label: 'Thu' },
                              { height: 60, label: 'Fri' },
                              { height: 92, label: 'Sat' },
                              { height: 76, label: 'Sun' },
                            ].map((item) => (
                              <div
                                key={item.label}
                                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
                              >
                                <span className="hidden text-[7px] text-slate-500 sm:block">
                                  {item.height}%
                                </span>

                                <div
                                  className="w-full max-w-[24px] rounded-t-md bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-400 opacity-90 sm:max-w-[30px]"
                                  style={{
                                    height: `${item.height}%`,
                                  }}
                                />

                                <span className="text-[6px] text-slate-500 sm:text-[8px]">
                                  {item.label}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                              </div>

                              <div className="min-w-0">
                                <p className="text-[8px] text-slate-500">
                                  Overall growth
                                </p>

                                <p className="truncate text-[10px] font-bold text-emerald-400">
                                  +18.4% this month
                                </p>
                              </div>
                            </div>

                            <BarChart3 className="h-4 w-4 shrink-0 text-slate-600" />
                          </div>
                        </div>

                        {/* Activity */}

                        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 sm:p-5 lg:col-span-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-[11px] font-bold text-white sm:text-sm">
                                Recent Activity
                              </h4>

                              <p className="mt-1 text-[8px] text-slate-500 sm:text-[9px]">
                                Latest academic updates
                              </p>
                            </div>

                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                          </div>

                          <div className="mt-4 space-y-3">
                            {activityItems.map((activity) => {
                              const Icon = activity.icon;

                              return (
                                <div
                                  key={activity.title}
                                  className="flex min-w-0 items-center gap-2.5"
                                >
                                  <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activity.iconClass}`}
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[9px] font-semibold text-slate-200 sm:text-[10px]">
                                      {activity.title}
                                    </p>

                                    <p className="truncate text-[8px] text-slate-500">
                                      {activity.subtitle}
                                    </p>
                                  </div>

                                  <span className="shrink-0 text-[7px] text-slate-600 sm:text-[8px]">
                                    {activity.time}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            className="mt-4 w-full rounded-lg border border-white/10 bg-white/[0.03] py-2 text-[8px] font-semibold text-blue-400 transition hover:bg-white/[0.06]"
                          >
                            View all activity
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            STATS
        ========================================================= */}

        <section className="relative border-y border-white/10 bg-slate-950">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 px-3 py-8 sm:grid-cols-4 sm:px-6 sm:py-10 lg:px-8">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="group flex min-w-0 flex-col items-center px-2 text-center transition duration-300 hover:-translate-y-1 sm:px-3"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 transition duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/20 sm:h-11 sm:w-11">
                    <Icon className="h-5 w-5" />
                  </div>

                  <p className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-[11px] font-medium text-slate-400 sm:text-xs">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================
            FEATURES
        ========================================================= */}

        <section className="relative overflow-hidden bg-slate-950 py-16 sm:py-24">
          {/* Background image */}

          <div
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{
              backgroundImage: "url('/images/1 (1).jpg')",
            }}
          />

          <div className="absolute inset-0 bg-slate-950/90" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-10 max-w-3xl px-2 text-center sm:mb-14 sm:px-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-300">
                <Sparkles className="h-3.5 w-3.5" />

                Everything connected
              </div>

              <h2 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                Everything your institution needs.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
                Replace disconnected academic workflows with one intelligent,
                secure, and beautifully organized platform.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-blue-400/30 hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-blue-500/10 sm:p-6"
                    style={{
                      animationDelay: `${index * 80}ms`,
                    }}
                  >
                    <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition duration-500 group-hover:bg-cyan-400/20" />

                    <div className="relative">
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-cyan-400/10 text-blue-400 transition duration-500 group-hover:rotate-3 group-hover:scale-110">
                        <Icon className="h-6 w-6" />
                      </div>

                      <h3 className="text-base font-bold text-white">
                        {feature.title}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {feature.desc}
                      </p>

                      <div className="mt-5 flex items-center gap-1 text-xs font-bold text-cyan-400 opacity-0 transition duration-300 group-hover:opacity-100">
                        Learn more

                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================
            SECURITY
        ========================================================= */}

        <section className="relative overflow-hidden bg-slate-950 py-16 sm:py-20">
          <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />

                  Built with security in mind
                </div>

                <h2 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                  One secure space for every academic role.
                </h2>

                <p className="mt-5 text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
                  SmartExam Pro separates responsibilities across the
                  university while keeping the complete academic ecosystem
                  connected.
                </p>

                <div className="mt-7 space-y-4">
                  {[
                    'Super Admin control',
                    'Department-level management',
                    'Faculty academic workspace',
                    'Student personalized dashboard',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>

                      <span className="text-sm font-semibold text-slate-300">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Glass role card */}

              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl" />

                <div className="relative rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl backdrop-blur-2xl sm:p-7">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">
                        Access Control
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Permission-based academic ecosystem
                      </p>
                    </div>

                    <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-400" />
                  </div>

                  <div className="space-y-3">
                    {[
                      ['Super Admin', 'Full platform control'],
                      ['Department Admin', 'Department operations'],
                      ['Faculty', 'Teaching & grading'],
                      ['Student', 'Learning & submissions'],
                    ].map(([role, desc], index) => (
                      <div
                        key={role}
                        className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.07] sm:gap-4 sm:p-4"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-400/10 sm:h-10 sm:w-10">
                          <span className="text-sm font-black text-blue-400">
                            0{index + 1}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {role}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {desc}
                          </p>
                        </div>

                        <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            CTA
        ========================================================= */}

        <section className="relative overflow-hidden bg-slate-950 px-3 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 sm:rounded-[2rem]">
            {/* Background image */}

            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/images/1 (1).jpg')",
              }}
            />

            {/* Dark overlay */}

            <div className="absolute inset-0 bg-slate-950/80" />

            {/* Blue gradient */}

            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-slate-950/60 to-cyan-900/50" />

            {/* Glow */}

            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

            <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

            <div className="relative px-5 py-12 text-center sm:px-12 sm:py-16 lg:px-20 lg:py-20">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur-xl">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>

              <h2 className="mx-auto max-w-3xl text-2xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                Ready to modernize your institution?
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                One intelligent workspace for your entire academic ecosystem —
                connecting faculty, students, departments, assessments, and
                academic operations in one seamless experience.
              </p>

              <Link
                to="/register"
                className="group mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-blue-700 shadow-2xl transition duration-300 hover:-translate-y-1 hover:bg-slate-50"
              >
                Create your account

                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-7 text-center sm:gap-5 sm:px-6 sm:py-8 sm:text-left lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>

            <span className="font-bold text-white">
              SmartExam{' '}
              <span className="text-cyan-400">
                Pro
              </span>
            </span>
          </Link>

          <p className="text-center text-xs text-slate-500">
            Built for modern educational institutions.
          </p>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span>Secure</span>

            <span>•</span>

            <span>Responsive</span>

            <span>•</span>

            <span>Real-time</span>
          </div>
        </div>
      </footer>
    </div>
  );
}