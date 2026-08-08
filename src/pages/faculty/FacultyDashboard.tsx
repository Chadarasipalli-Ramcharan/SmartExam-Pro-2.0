import { useEffect, useState } from 'react';
import { BookOpen, ClipboardList, FlaskConical, FileText, FolderOpen, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { SkeletonCard } from '@/components/Loading';
import { fetchSubjects, fetchAssignments, fetchLabTasks, fetchMaterials, fetchAllResults, fetchAllExams } from '@/lib/queries';
import type { SubjectWithDetails, Assignment, LabTask, Material, Result, Exam } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from 'recharts';

export function FacultyDashboard() {
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [labTasks, setLabTasks] = useState<LabTask[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      fetchSubjects({ facultyId: profile.id }),
      fetchAssignments(undefined, profile.id),
      fetchLabTasks(undefined, profile.id),
      fetchMaterials(),
      fetchAllResults(),
      fetchAllExams(),
    ]).then(([s, a, l, m, r, e]) => {
      setSubjects(s); setAssignments(a); setLabTasks(l); setMaterials(m); setResults(r); setExams(e);
    }).finally(() => setLoading(false));
  }, [profile]);

  if (!profile) return null;

  const myExams = exams.filter((e) => e.created_by === profile.id);
  const myMaterials = materials.filter((m) => m.faculty_id === profile.id);
  const pendingGrading = results.filter((r) => r.status === 'fail').length; // simplified

  // Student performance chart - avg score per subject
  const subjectPerformance = subjects.map((s) => {
    const subjectExams = myExams.filter((e) => e.subject_id === s.id);
    const subjectResults = results.filter((r) => subjectExams.some((e) => e.id === r.exam_id));
    const avg = subjectResults.length > 0 ? Math.round(subjectResults.reduce((sum, r) => sum + r.percentage, 0) / subjectResults.length) : 0;
    return { name: s.code, avgScore: avg, attempts: subjectResults.length };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Faculty Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome, {profile.full_name}. Manage your subjects and activities.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={BookOpen} label="My Subjects" value={subjects.length} color="primary" />
            <StatCard icon={ClipboardList} label="Assignments" value={assignments.length} color="accent" />
            <StatCard icon={FileText} label="Exams" value={myExams.length} color="warning" />
            <StatCard icon={FlaskConical} label="Lab Tasks" value={labTasks.length} color="success" />
            <StatCard icon={FolderOpen} label="Materials" value={myMaterials.length} color="primary" />
            <StatCard icon={TrendingUp} label="Exam Attempts" value={results.filter((r) => myExams.some((e) => e.id === r.exam_id)).length} color="accent" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Student Performance</h3>
              <p className="text-sm text-slate-400 mb-4">Average scores across your subjects</p>
              {subjectPerformance.length > 0 && subjectPerformance.some((s) => s.attempts > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={subjectPerformance} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm"><div className="text-center"><AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />No exam results yet.</div></div>}
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">My Subjects</h3>
              {subjects.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">No subjects assigned yet.</p> : (
                <div className="space-y-2">
                  {subjects.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center"><BookOpen className="w-4 h-4" /></div>
                        <div><p className="font-medium text-slate-900 dark:text-white text-sm">{s.name}</p><p className="text-xs text-slate-400">{s.code} · {s.credits} credits</p></div>
                      </div>
                      <span className="text-xs text-slate-400">{s.section?.name ? `Sec ${s.section.name}` : 'All'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
