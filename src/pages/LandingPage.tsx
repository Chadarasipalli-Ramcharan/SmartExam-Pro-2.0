import { Link } from 'react-router-dom';
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
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

export function LandingPage() {
  const { session } = useAuth();

  const features = [
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
      desc: "Bring the institution's academic workflow together instead of managing disconnected systems.",
    },
  ];

  const stats = [
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

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">

      {/* =========================================================
          NAVBAR
      ========================================================= */}

      <header className="fixed inset-x-0 top-0 z-50">

        <div className="mx-auto mt-3 max-w-7xl px-4 sm:px-6 lg:px-8">

          <nav className="flex h-16 items-center justify-between rounded-2xl border border-white/15 bg-slate-950/45 px-4 shadow-2xl shadow-black/20 backdrop-blur-2xl">

            <Link
              to="/"
              className="flex items-center gap-3"
            >

              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-sky-400 shadow-lg shadow-blue-500/30">

                <GraduationCap className="h-5 w-5 text-white" />

                <div className="absolute -inset-1 -z-10 rounded-xl bg-blue-500/30 blur-md" />

              </div>

              <div>

                <div className="text-lg font-bold tracking-tight text-white">

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

            <div className="flex items-center gap-2 sm:gap-3">

              {session ? (

                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Dashboard

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
                    className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    Get Started

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

        <section className="relative min-h-[900px] overflow-hidden pt-32">

          {/* =====================================================
              REAL IMAGE BACKGROUND
          ===================================================== */}

          <div
className="absolute inset-0 bg-cover bg-center scale-110 -translate-y-56 -translate-x-12"
  style={{
    backgroundImage: "url('/images/1 (1).jpg')",
  }}
/>

          {/* Dark overlay */}

          <div className="absolute inset-0 bg-slate-950/75" />

          
          {/* Image grid */}

          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:50px_50px]" />


          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="mx-auto max-w-5xl text-center">


              {/* Badge */}

              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-200 shadow-2xl backdrop-blur-xl">

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

              <h1 className="text-4xl leading-[1] tracking-tight sm:text-5xl lg:text-7xl">

                <span className="block font-display font-normal text-white drop-shadow-2xl">

                  One platform.

                </span>

                <span className="mt-2 block font-sans text-4xl font-extrabold tracking-[-0.035em] sm:text-5xl lg:text-7xl">

                  <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-sky-400 bg-clip-text text-transparent">

                    Your entire university.

                  </span>

                </span>

              </h1>


              {/* Description */}

              <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-slate-200/85 sm:text-lg">

                Built for modern universities, SmartExam Pro connects students,
                faculty, departments, assessments, and academic workflows
                through one intelligent digital ecosystem.

              </p>


              {/* CTA */}

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">

                <Link
                  to="/register"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 text-base font-bold text-white shadow-2xl shadow-blue-500/30 transition duration-300 hover:-translate-y-1 hover:shadow-cyan-500/30 sm:w-auto"
                >

                  Start for Free

                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />

                </Link>


                <Link
                  to="/login"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-7 py-3.5 text-base font-bold text-white shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/15 sm:w-auto"
                >

                  Explore Platform

                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />

                </Link>

              </div>


              {/* Trust */}

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs font-medium text-slate-300">

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
                DASHBOARD PREVIEW
            ===================================================== */}

            <div className="relative mx-auto mt-16 max-w-5xl">

              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-blue-500/30 via-cyan-400/20 to-purple-500/30 blur-3xl" />

              <div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-2 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">

                <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/90">


                  {/* Browser bar */}

                  <div className="flex h-11 items-center gap-2 border-b border-white/10 bg-slate-950 px-4">

                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />

                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />

                    <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />

                    <div className="mx-auto hidden h-6 w-1/2 rounded-md bg-white/5 sm:block" />

                  </div>


                  {/* Dashboard */}

                  <div className="grid grid-cols-12 gap-4 p-5 sm:p-7">


                    {/* Sidebar */}

                    <div className="col-span-3 hidden rounded-xl border border-white/10 bg-white/5 p-3 md:block">

                      <div className="mb-5 flex items-center gap-2">

                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">

                          <GraduationCap className="h-4 w-4 text-white" />

                        </div>

                        <span className="text-xs font-bold text-white">
                          SmartExam
                        </span>

                      </div>

                      <div className="space-y-2">

                        {[1, 2, 3, 4, 5, 6].map((item) => (

                          <div
                            key={item}
                            className={`h-8 rounded-lg ${
                              item === 1
                                ? 'bg-blue-500/20'
                                : 'bg-white/[0.03]'
                            }`}
                          />

                        ))}

                      </div>

                    </div>


                    {/* Dashboard content */}

                    <div className="col-span-12 space-y-4 md:col-span-9">


                      <div className="flex items-center justify-between">

                        <div>

                          <div className="h-3 w-32 rounded bg-white/10" />

                          <div className="mt-2 h-2 w-48 rounded bg-white/5" />

                        </div>

                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400" />

                      </div>


                      {/* Stats cards */}

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                        {[
                          'bg-blue-500/10',
                          'bg-violet-500/10',
                          'bg-emerald-500/10',
                          'bg-orange-500/10',
                        ].map((bg, i) => (

                          <div
                            key={i}
                            className={`rounded-xl border border-white/10 bg-white/5 p-4 ${bg}`}
                          >

                            <div className="h-2 w-12 rounded bg-white/10" />

                            <div className="mt-3 h-6 w-16 rounded bg-white/15" />

                            <div className="mt-2 h-2 w-20 rounded bg-white/5" />

                          </div>

                        ))}

                      </div>


                      {/* Chart */}

                      <div className="rounded-xl border border-white/10 bg-white/5 p-5">

                        <div className="mb-5 flex items-center justify-between">

                          <div className="h-3 w-32 rounded bg-white/10" />

                          <div className="h-7 w-20 rounded-lg bg-white/5" />

                        </div>

                        <div className="flex h-36 items-end justify-between gap-2">

                          {[45, 65, 40, 80, 58, 90, 72, 96, 67, 84, 76, 92].map(
                            (height, i) => (

                              <div
                                key={i}
                                className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400 opacity-80"
                                style={{ height: `${height}%` }}
                              />

                            )
                          )}

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>


              {/* Floating badge left */}

              <div className="absolute -left-4 top-16 hidden rounded-2xl border border-white/15 bg-slate-950/70 p-3 shadow-2xl backdrop-blur-xl sm:block">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">

                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />

                  </div>

                  <div>

                    <p className="text-xs font-bold text-white">
                      Academic Data
                    </p>

                    <p className="text-[10px] text-slate-400">
                      Synced in real time
                    </p>

                  </div>

                </div>

              </div>


              {/* Floating badge right */}

              <div className="absolute -right-4 bottom-16 hidden rounded-2xl border border-white/15 bg-slate-950/70 p-3 shadow-2xl backdrop-blur-xl sm:block">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">

                    <BarChart3 className="h-5 w-5 text-blue-400" />

                  </div>

                  <div>

                    <p className="text-xs font-bold text-white">
                      Live Analytics
                    </p>

                    <p className="text-[10px] text-slate-400">
                      Insights at a glance
                    </p>

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

          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 px-4 py-10 sm:grid-cols-4 sm:px-6 lg:px-8">

            {stats.map((stat) => {

              const Icon = stat.icon;

              return (

                <div
                  key={stat.label}
                  className="group flex flex-col items-center px-3 text-center transition duration-300 hover:-translate-y-1"
                >

                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 transition duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/20">

                    <Icon className="h-5 w-5" />

                  </div>

                  <p className="text-3xl font-black tracking-tight text-white">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-400">
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

        <section className="relative overflow-hidden bg-slate-950 py-24">

          {/* Background image */}

          <div
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{
              backgroundImage: "url('/images/university-campus.jpg')",
            }}
          />

          <div className="absolute inset-0 bg-slate-950/90" />


          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="mx-auto mb-14 max-w-3xl text-center">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-300">

                <Sparkles className="h-3.5 w-3.5" />

                Everything connected

              </div>

              <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">

                Everything your institution needs.

              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">

                Replace disconnected academic workflows with one intelligent,
                secure, and beautifully organized platform.

              </p>

            </div>


            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {features.map((feature, index) => {

                const Icon = feature.icon;

                return (

                  <div
                    key={feature.title}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-6 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-blue-400/30 hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-blue-500/10"
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

        <section className="relative overflow-hidden bg-slate-950 py-20">

          <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="grid items-center gap-12 lg:grid-cols-2">


              <div>

                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">

                  <ShieldCheck className="h-3.5 w-3.5" />

                  Built with security in mind

                </div>


                <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">

                  One secure space for every academic role.

                </h2>


                <p className="mt-5 text-base leading-7 text-slate-400">

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

                    <div
                      key={item}
                      className="flex items-center gap-3"
                    >

                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10">

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

                <div className="relative rounded-3xl border border-white/10 bg-white/[0.045] p-7 shadow-2xl backdrop-blur-2xl">

                  <div className="mb-6 flex items-center justify-between">

                    <div>

                      <p className="text-sm font-bold text-white">
                        Access Control
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Permission-based academic ecosystem
                      </p>

                    </div>

                    <ShieldCheck className="h-6 w-6 text-emerald-400" />

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
                        className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.07]"
                      >

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-400/10">

                          <span className="text-sm font-black text-blue-400">
                            0{index + 1}
                          </span>

                        </div>

                        <div>

                          <p className="text-sm font-bold text-white">
                            {role}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {desc}
                          </p>

                        </div>

                        <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-400" />

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

        <section className="relative overflow-hidden bg-slate-950 px-4 pb-24 sm:px-6 lg:px-8">

          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10">

            {/* Background image */}

            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/images/university-campus.jpg')",
              }}
            />

            {/* Dark overlay */}

            <div className="absolute inset-0 bg-slate-950/80" />

            {/* Blue gradient */}

            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-slate-950/60 to-cyan-900/50" />


            {/* Glow */}

            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

            <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />


            <div className="relative px-6 py-16 text-center sm:px-12 lg:px-20 lg:py-20">

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur-xl">

                <GraduationCap className="h-7 w-7 text-white" />

              </div>


              <h2 className="mx-auto max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">

                Ready to modernize your institution?

              </h2>


              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">

                Bring academic management, student activities,
                faculty workflows, and institutional analytics
                into one powerful platform.

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

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">

          <Link
            to="/"
            className="flex items-center gap-2.5"
          >

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


          <p className="text-xs text-slate-500">
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