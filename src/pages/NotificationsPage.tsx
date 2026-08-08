import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2, FileText, ClipboardList, FlaskConical, FolderOpen, Megaphone, Award, AlertCircle } from 'lucide-react';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/queries';
import type { Notification, NotificationType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { SkeletonRow } from '@/components/Loading';

const typeIcons: Record<NotificationType, typeof Bell> = {
  assignment: ClipboardList, quiz: FileText, exam: FileText, lab_task: FlaskConical,
  material: FolderOpen, grade: Award, announcement: Megaphone,
};

const typeColors: Record<NotificationType, string> = {
  assignment: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
  quiz: 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
  exam: 'bg-warning-100 dark:bg-warning-700/30 text-warning-600 dark:text-warning-400',
  lab_task: 'bg-success-100 dark:bg-success-700/30 text-success-600 dark:text-success-400',
  material: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
  grade: 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
  announcement: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
};

export function NotificationsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!profile) return;
    setLoading(true);
    try { setItems(await fetchNotifications(profile.id)); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [profile]);

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setItems((p) => p.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function handleMarkAllRead() {
    if (!profile) return;
    await markAllNotificationsRead(profile.id);
    setItems((p) => p.map((n) => ({ ...n, is_read: true })));
  }

  if (!profile) return null;
  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary text-sm"><CheckCheck className="w-4 h-4" /> Mark all read</button>
        )}
      </div>

      {loading ? (
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((n) => {
            const Icon = typeIcons[n.type] ?? Bell;
            return (
              <div key={n.id} className={`flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition ${!n.is_read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeColors[n.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{n.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => handleMarkRead(n.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Mark as read">
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <div className={`w-2 h-2 rounded-full shrink-0 mt-3 ${n.is_read ? 'bg-transparent' : 'bg-primary-500'}`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
