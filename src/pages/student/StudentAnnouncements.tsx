import { useEffect, useState } from 'react';
import { Megaphone, AlertCircle, Info, AlertTriangle, User, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { SkeletonRow } from '@/components/Loading';
import { fetchAnnouncements } from '@/lib/queries';
import type { AnnouncementWithDetails, Priority, TargetAudience } from '@/types';

const priorityConfig: Record<Priority, { icon: typeof AlertCircle; badge: string; color: string }> = {
  high: { icon: AlertTriangle, badge: 'badge-error', color: 'text-error-600 dark:text-error-500' },
  normal: { icon: Info, badge: 'badge-primary', color: 'text-primary-600 dark:text-primary-400' },
  low: { icon: AlertCircle, badge: 'badge-secondary', color: 'text-slate-500 dark:text-slate-400' },
};

const audienceLabels: Record<TargetAudience, string> = {
  all: 'All Users',
  students: 'Students',
  faculty: 'Faculty',
  department: 'Department',
  section: 'Section',
  subject: 'Subject',
  dept_admins: 'Dept Admins',
  faculty_students: 'Faculty + Students',
};

export function StudentAnnouncements() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<AnnouncementWithDetails[]>([]);

  useEffect(() => {
    if (!profile?.department_id) return;
    let mounted = true;
    (async () => {
      try {
        const data = await fetchAnnouncements(profile.department_id ?? undefined);
        if (!mounted) return;
        // Filter to announcements relevant to this student
        const relevant = data.filter((a) => {
          if (a.target_audience === 'all' || a.target_audience === 'faculty_students') return true;
          if (a.target_audience === 'students') return true;
          if (a.target_audience === 'department' && a.department_id === profile.department_id) return true;
          if (a.target_audience === 'section' && a.section_id === profile.section_id) return true;
          return false;
        });
        if (mounted) setAnnouncements(relevant);
      } catch (err) {
        console.error('Announcements load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [profile?.department_id, profile?.section_id]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Announcements" subtitle="Updates relevant to you" />
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Announcements"
        subtitle="Updates relevant to you"
        icon={Megaphone}
      />

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          message="There are no announcements for your department right now."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => {
            const cfg = priorityConfig[a.priority];
            const PriorityIcon = cfg.icon;
            return (
              <div key={a.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${cfg.color}`}>
                    <PriorityIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {a.title}
                      </h3>
                      <span className={`badge ${cfg.badge} uppercase`}>{a.priority}</span>
                      <span className="badge badge-secondary">
                        {audienceLabels[a.target_audience]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">
                      {a.content}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      {a.author && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {a.author.full_name}
                        </span>
                      )}
                      {a.department && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {a.department.name}
                        </span>
                      )}
                      {a.subject && (
                        <span>{a.subject.code} · {a.subject.name}</span>
                      )}
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
