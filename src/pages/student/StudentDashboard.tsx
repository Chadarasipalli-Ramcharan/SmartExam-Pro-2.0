import { useEffect, useState } from 'react';
import {
  ClipboardList, ClipboardCheck, FlaskConical, BookOpen, Bell, TrendingUp,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/StatCard';
import { SkeletonCard, SkeletonRow } from '@/components/Loading';
import { PageHeader } from '@/components/PageHeader';
import {
  fetchAssignments,
  fetchLabTasks,
  fetchMaterials,
  fetchNotifications,
  fetchQuizzes,
  fetchStudentResults,
} from '@/lib/queries';
import type {
  AssignmentWithDetails, LabTaskWithDetails, MaterialWithDetails,
  Notification, Exam, Result,
  Quiz,
} from '@/types';

interface TrendPoint {
  label: string;
  percentage: number;
}

export function StudentDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [labTasks, setLabTasks] = useState<LabTaskWithDetails[]>([]);
  const [materials, setMaterials] = useState<MaterialWithDetails[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    let mounted = true;
    (async () => {
      try {
        const [a, l, m, n, q, r] = await Promise.all([
  fetchAssignments(),
  fetchLabTasks(),
  fetchMaterials(),
  fetchNotifications(profile.id),
  fetchQuizzes(),
  fetchStudentResults(profile.id),
]);
        if (!mounted) return;
        setAssignments(a);
        setLabTasks(l);
        setMaterials(m);
        setNotifications(n);
setQuizzes(q);
        setResults(r);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [profile?.id]);

  const sectionId = profile?.section_id ?? null;

  const myAssignments = assignments.filter(
    (a) => a.status === 'published' && a.section_id === sectionId,
  );
  const myLabTasks = labTasks.filter(
    (t) => t.status === 'published' && t.section_id === sectionId,
  );
const myQuizzes = quizzes.filter((q) => q.section_id === sectionId);
  const unreadNotifications = notifications.filter((n) => !n.is_read);

  const trendData: TrendPoint[] = results
    .slice()
    .reverse()
    .map((r, i) => ({
      label: `Exam ${i + 1}`,
      percentage: r.percentage,
    }));

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Dashboard" subtitle="Welcome back to SmartExam Pro" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="card p-6">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${profile?.full_name ?? 'Student'}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          icon={ClipboardList}
          label=" Assignments"
          value={myAssignments.length}
          hint="Avaliable assignments"
          color="primary"
        />
        <StatCard
  icon={ClipboardCheck}
  label="Quizzes"
  value={myQuizzes.length}
  hint="Available quizzes"
  color="accent"
/>
        <StatCard
          icon={FlaskConical}
          label="Lab Tasks"
          value={myLabTasks.length}
          hint="Active lab work"
          color="success"
        />
        <StatCard
          icon={BookOpen}
          label="Materials"
          value={materials.length}
          hint="Study resources"
          color="warning"
        />
        <StatCard
          icon={Bell}
          label="Notifications"
          value={unreadNotifications.length}
          hint="Unread updates"
          color="error"
        />
      </div>

      {trendData.length > 0 && (
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Performance Trend
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Score']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
            Recent Assignments
          </h2>
          {myAssignments.length === 0 ? (
            <p className="text-sm text-slate-400">No assignments for your section.</p>
          ) : (
            <ul className="space-y-3">
              {myAssignments.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {a.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {a.subject?.code ?? '—'} · Due {new Date(a.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
            Recent Notifications
          </h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400">No notifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.slice(0, 5).map((n) => (
                <li key={n.id} className="flex items-start gap-3">
                  <div
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      n.is_read ? 'bg-slate-300' : 'bg-primary-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-400">{n.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
