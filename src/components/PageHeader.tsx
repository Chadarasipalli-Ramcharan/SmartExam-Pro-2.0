import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

interface EmptyProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyProps) {
  return (
    <div className="card p-12 text-center">
      <Icon className="w-10 h-10 mx-auto text-slate-300 mb-3" />
      <p className="text-slate-500 font-medium">{title}</p>
      {message && <p className="text-xs text-slate-400 mt-1">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
