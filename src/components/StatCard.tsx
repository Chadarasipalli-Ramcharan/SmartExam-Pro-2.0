import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'error';
}

const colorMap = {
  primary: { bg: 'bg-primary-50 dark:bg-primary-950/40', text: 'text-primary-600 dark:text-primary-400', ring: 'ring-primary-100 dark:ring-primary-900/40' },
  accent: { bg: 'bg-accent-50 dark:bg-accent-950/40', text: 'text-accent-600 dark:text-accent-400', ring: 'ring-accent-100 dark:ring-accent-900/40' },
  success: { bg: 'bg-success-50 dark:bg-success-700/20', text: 'text-success-600 dark:text-success-500', ring: 'ring-success-100 dark:ring-success-900/30' },
  warning: { bg: 'bg-warning-50 dark:bg-warning-700/20', text: 'text-warning-600 dark:text-warning-500', ring: 'ring-warning-100 dark:ring-warning-900/30' },
  error: { bg: 'bg-error-50 dark:bg-error-700/20', text: 'text-error-600 dark:text-error-500', ring: 'ring-error-100 dark:ring-error-900/30' },
};

export function StatCard({ icon: Icon, label, value, hint, color = 'primary' }: Props) {
  const c = colorMap[color];
  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div className={`p-3 rounded-xl ${c.bg} ${c.text} ring-1 ${c.ring}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
