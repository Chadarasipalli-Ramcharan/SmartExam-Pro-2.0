import { Link } from 'react-router-dom';
import {
  GraduationCap, BarChart3, ShieldCheck, Users, BookOpen, Zap, ArrowRight,
  CalendarDays, Megaphone, FlaskConical, FolderOpen, ClipboardList, Award, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function LandingPage() {
  const { session } = useAuth();

  const features = [
    { icon: BookOpen, title: 'Subject Management', desc: 'Create and organize subjects across departments, semesters, and sections with faculty assignments and credit tracking.' },
    { icon: ClipboardList, title: 'Assignments & Lab Tasks', desc: 'Publish assignments with due dates and marks. Students submit files and code; faculty grade with inline feedback.' },
    { icon: Zap, title: 'Polls & Surveys', desc: 'Run single-choice, multiple-choice, and yes/no polls. Target students, faculty, or both. View real-time response analytics.' },
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'University-wide insights: enrollment growth, department distribution, poll participation, and faculty allocation metrics.' },
    { icon: Megaphone, title: 'Announcements', desc: 'Broadcast announcements to departments, sections, or subjects with file attachments and expiry dates.' },
    { icon: FolderOpen, title: 'Study Materials', desc: 'Upload PDFs, slides, videos, and links organized by subject. Students browse and download instantly.' },
    { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Four distinct roles — Super Admin, Department Admin, Faculty, and Student — each with scoped permissions and dashboards.' },
  ];

  const productStats = [
    { icon: Users, value: '4', label: 'User Roles' },
    { icon: BookOpen, value: '8+', label: 'Academic Modules' },
    { icon: BarChart3, value: '100%', label: 'Real-Time Data' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">SmartExam <span className="text-primary-600 dark:text-primary-400">Pro</span></span>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link to="/dashboard" className="btn-primary text-sm">Go to Dashboard <ArrowRight className="w-4 h-4" /></Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50 via-white to-white dark:from-primary-950/30 dark:via-slate-950 dark:to-slate-950" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent-200/30 dark:bg-accent-800/10 rounded-full blur-3xl" />
        <div className="absolute top-40 left-10 w-96 h-96 bg-primary-200/20 dark:bg-primary-800/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-primary-200/50 dark:border-primary-800/50 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6 shadow-sm">
              <Award className="w-4 h-4" />
              University Academic Management Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              The complete platform for
              <span className="block bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">university academics</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              SmartExam Pro unifies subjects, assignments, lab tasks, polls, and analytics into one elegant platform — built for institutions that demand efficiency and clarity.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="btn-primary text-base px-6 py-3 w-full sm:w-auto">
                Start for Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="btn-secondary text-base px-6 py-3 w-full sm:w-auto">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Product Stats */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {productStats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-2">
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Everything your institution needs</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">A complete academic management toolkit wrapped in a clean, responsive interface.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="card p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-transform duration-200">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 p-10 lg:p-16 text-center shadow-xl shadow-primary-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white">Ready to transform your institution?</h2>
            <p className="mt-3 text-primary-100 max-w-xl mx-auto">Join SmartExam Pro and digitize your entire academic workflow — from subjects and assignments to polls and analytics.</p>
            <Link to="/register" className="mt-6 inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-lg hover:bg-primary-50 transition shadow-lg">
              Create your account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">SmartExam Pro</span>
          </div>
          <p className="text-sm text-slate-400">Built for modern educational institutions.</p>
        </div>
      </footer>
    </div>
  );
}
