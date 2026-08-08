import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, Award, Users, BookOpen, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { SkeletonCard } from '@/components/Loading';
import { fetchAcademicRecords, fetchStudentProfiles, fetchFacultyProfiles, fetchSubjects, fetchSections } from '@/lib/queries';
import type { AcademicRecordWithDetails, Profile, Subject, Section } from '@/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

const GRADE_COLORS: Record<string, string> = {
  'A+': '#22c55e', A: '#3b82f6', B: '#f59e0b', C: '#a855f7', D: '#ec4899', F: '#ef4444',
};

export function DeptAdminAnalytics() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<AcademicRecordWithDetails[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [faculty, setFaculty] = useState<Profile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.department_id) return;
    Promise.all([
      fetchAcademicRecords({ departmentId: profile.department_id }),
      fetchStudentProfiles(), fetchFacultyProfiles(), fetchSubjects(), fetchSections(),
    ]).then(([r, s, f, sub, sec]) => {
      setRecords(r); setStudents(s); setFaculty(f); setSubjects(sub); setSections(sec);
    }).finally(() => setLoading(false));
  }, [profile]);

  const deptStudents = useMemo(() => students.filter((s) => s.department_id === profile?.department_id), [students, profile]);
  const deptFaculty = useMemo(() => faculty.filter((f) => f.department_id === profile?.department_id), [faculty, profile]);
  const deptSubjects = useMemo(() => subjects.filter((s) => s.department_id === profile?.department_id), [subjects, profile]);
  const deptSections = useMemo(() => sections.filter((s) => s.department_id === profile?.department_id), [sections, profile]);

  const avgScore = records.length > 0 ? Math.round(records.reduce((s, r) => s + r.percentage, 0) / records.length * 10) / 10 : 0;
  const passCount = records.filter((r) => r.pass_fail === 'pass').length;
  const failCount = records.length - passCount;
  const passRate = records.length > 0 ? Math.round((passCount / records.length) * 1000) / 10 : 0;
  const failRate = records.length > 0 ? Math.round((failCount / records.length) * 1000) / 10 : 0;

  const semesterData = useMemo(() => {
    const bySem: Record<string, { name: string; avg: number; count: number }> = {};
    records.forEach((r) => {
      const name = r.semester?.name ?? 'Unknown';
      if (!bySem[name]) bySem[name] = { name, avg: 0, count: 0 };
      bySem[name].avg += r.percentage;
      bySem[name].count++;
    });
    return Object.values(bySem).map((d) => ({ name: d.name, avg: Math.round(d.avg / d.count * 10) / 10 }));
  }, [records]);

  const subjectData = useMemo(() => {
    const bySub: Record<string, { name: string; avg: number; pass: number; total: number }> = {};
    records.forEach((r) => {
      const name = r.subject?.code ?? 'Unknown';
      if (!bySub[name]) bySub[name] = { name, avg: 0, pass: 0, total: 0 };
      bySub[name].avg += r.percentage;
      bySub[name].total++;
      if (r.pass_fail === 'pass') bySub[name].pass++;
    });
    return Object.values(bySub).map((d) => ({
      name: d.name, avg: Math.round(d.avg / d.total * 10) / 10,
      passRate: Math.round(d.pass / d.total * 100),
    }));
  }, [records]);

  const facultyData = useMemo(() => {
    const byFac: Record<string, { name: string; avg: number; count: number }> = {};
    records.forEach((r) => {
      const fac = faculty.find((f) => f.id === r.faculty_id);
      const name = fac?.full_name?.split(' ')[0] ?? 'Unknown';
      if (!byFac[name]) byFac[name] = { name, avg: 0, count: 0 };
      byFac[name].avg += r.percentage;
      byFac[name].count++;
    });
    return Object.values(byFac).map((d) => ({ name: d.name, avg: Math.round(d.avg / d.count * 10) / 10 }));
  }, [records, faculty]);

  const gradeData = useMemo(() => {
    const byGrade: Record<string, number> = {};
    records.forEach((r) => { byGrade[r.grade] = (byGrade[r.grade] ?? 0) + 1; });
    return Object.entries(byGrade).map(([name, value]) => ({ name, value, color: GRADE_COLORS[name] ?? '#94a3b8' }));
  }, [records]);

  const sectionData = useMemo(() => {
    const bySec: Record<string, { name: string; avg: number; count: number }> = {};
    records.forEach((r) => {
      const name = r.section?.name ?? 'Unknown';
      if (!bySec[name]) bySec[name] = { name, avg: 0, count: 0 };
      bySec[name].avg += r.percentage;
      bySec[name].count++;
    });
    return Object.values(bySec).map((d) => ({ name: d.name, avg: Math.round(d.avg / d.count * 10) / 10 }));
  }, [records]);

  const internalVsExternal = useMemo(() => {
    const intAvg = records.length > 0 ? Math.round(records.reduce((s, r) => s + r.internal_marks, 0) / records.length * 10) / 10 : 0;
    const extAvg = records.length > 0 ? Math.round(records.reduce((s, r) => s + r.external_marks, 0) / records.length * 10) / 10 : 0;
    return [
      { name: 'Internal', avg: intAvg },
      { name: 'External', avg: extAvg },
    ];
  }, [records]);

  const studentRanking = useMemo(() => {
    const byStudent: Record<string, { name: string; avg: number; count: number }> = {};
    records.forEach((r) => {
      const name = r.student?.full_name ?? 'Unknown';
      if (!byStudent[name]) byStudent[name] = { name, avg: 0, count: 0 };
      byStudent[name].avg += r.percentage;
      byStudent[name].count++;
    });
    return Object.values(byStudent)
      .map((d) => ({ name: d.name, avg: Math.round(d.avg / d.count * 10) / 10 }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);
  }, [records]);

  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Department Analytics" subtitle="Academic performance analytics for your department." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Students" value={deptStudents.length} color="primary" />
        <StatCard icon={BookOpen} label="Subjects" value={deptSubjects.length} color="accent" />
        <StatCard icon={TrendingUp} label="Avg Score" value={`${avgScore}%`} color={avgScore >= 50 ? 'success' : 'error'} />
        <StatCard icon={Award} label="Pass Rate" value={`${passRate}%`} color="success" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={BarChart3} label="Total Records" value={records.length} color="primary" />
        <StatCard icon={Award} label="Pass %" value={`${passRate}%`} color="success" />
        <StatCard icon={Award} label="Fail %" value={`${failRate}%`} color="error" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Semester Performance</h3>
          <p className="text-sm text-slate-400 mb-4">Average marks by semester</p>
          {semesterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={semesterData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgb(148 163 184 / 0.6)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                <Tooltip />
                <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data yet.</div>}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Subject Performance</h3>
          <p className="text-sm text-slate-400 mb-4">Average marks & pass rate by subject</p>
          {subjectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={subjectData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgb(148 163 184 / 0.6)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg" name="Avg %" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="passRate" name="Pass %" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data yet.</div>}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Faculty Performance</h3>
          <p className="text-sm text-slate-400 mb-4">Average student marks by faculty</p>
          {facultyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={facultyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgb(148 163 184 / 0.6)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                <Tooltip />
                <Bar dataKey="avg" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data yet.</div>}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Grade Distribution</h3>
          <p className="text-sm text-slate-400 mb-4">Distribution of grades across department</p>
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={gradeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label>
                  {gradeData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data yet.</div>}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Section Performance</h3>
          <p className="text-sm text-slate-400 mb-4">Average marks by section</p>
          {sectionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectionData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgb(148 163 184 / 0.6)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                <Tooltip />
                <Bar dataKey="avg" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data yet.</div>}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Internal vs External</h3>
          <p className="text-sm text-slate-400 mb-4">Comparison of internal and external marks</p>
          {records.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={internalVsExternal} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                <YAxis tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                <Tooltip />
                <Bar dataKey="avg" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data yet.</div>}
        </div>
      </div>

      {/* Student Ranking */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Top Students</h3>
        <p className="text-sm text-slate-400 mb-4">Highest performing students in department</p>
        {studentRanking.length > 0 ? (
          <div className="space-y-2">
            {studentRanking.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < 3 ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{i + 1}</div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">{s.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{s.avg}%</p>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="py-8 text-center text-slate-400 text-sm">No ranking data yet.</div>}
      </div>
    </div>
  );
}
