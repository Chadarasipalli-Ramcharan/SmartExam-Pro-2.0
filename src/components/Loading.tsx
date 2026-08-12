import { GraduationCap } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg animate-pulse">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
      </div>
      <div className="mt-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading AcadNexus Pro…</p>
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
      <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
      <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800/50 rounded" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
      <div className="flex-1">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
        <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/50 rounded" />
      </div>
      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
    </div>
  );
}
