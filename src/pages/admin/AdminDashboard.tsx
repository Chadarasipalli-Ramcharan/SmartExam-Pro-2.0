import { useEffect, useState } from 'react';
import { Users, FileText, HelpCircle, TrendingUp, Award, Activity, Building2, BookOpen, User, GraduationCap } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { SkeletonCard } from '@/components/Loading';
import { fetchAllExams, fetchAllResults, fetchStudentProfiles, fetchAllProfiles, fetchFacultyProfiles, fetchDepartments, fetchSubjects, fetchAcademicRecords } from '@/lib/queries';
import type { Exam, Result, Profile, Department, Subject, AcademicRecordWithDetails } from '@/types';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line,
} from 'recharts';

const GRADE_COLORS: Record<string, string> = {
  'A+': '#22c55e', A: '#3b82f6', B: '#f59e0b', C: '#a855f7', D: '#ec4899', F: '#ef4444',
};

export function AdminDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [faculty, setFaculty] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<AcademicRecordWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAllExams(), fetchAllResults(), fetchStudentProfiles(), fetchFacultyProfiles(), fetchDepartments(), fetchSubjects(), fetchAcademicRecords()])
      .then(([e, r, s, f, d, sub, rec]) => {
        setExams(e); setResults(r); setStudents(s); setFaculty(f); setDepartments(d); setSubjects(sub); setRecords(rec);
      })
      .finally(() => setLoading(false));
  }, []);

  // University-level academic analytics (aggregated from all departments)
  const collegePassCount = records.filter((r) => r.pass_fail === 'pass').length;
  const collegeFailCount = records.length - collegePassCount;
  const collegeAvgPct = records.length > 0 ? Math.round(records.reduce((s, r) => s + r.percentage, 0) / records.length * 10) / 10 : 0;
  const collegePassPct = records.length > 0 ? Math.round((collegePassCount / records.length) * 1000) / 10 : 0;
  const collegeFailPct = records.length > 0 ? Math.round((collegeFailCount / records.length) * 1000) / 10 : 0;

  const publishedExams = exams.filter((e) => e.status === 'published');

  const pieData = [
    { name: 'Pass', value: collegePassCount, color: '#22c55e' },
    { name: 'Fail', value: collegeFailCount, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const deptData = departments.map((d) => {
    const deptStudents = students.filter((s) => s.department_id === d.id).length;
    const deptFaculty = faculty.filter((f) => f.department_id === d.id).length;
    const deptRecords = records.filter((r) => r.department_id === d.id);
    const deptAvg = deptRecords.length > 0 ? Math.round(deptRecords.reduce((s, r) => s + r.percentage, 0) / deptRecords.length * 10) / 10 : 0;
    return { name: d.code, students: deptStudents, faculty: deptFaculty, avg: deptAvg };
  });

  const gradeData = (() => {
    const byGrade: Record<string, number> = {};
    records.forEach((r) => { byGrade[r.grade] = (byGrade[r.grade] ?? 0) + 1; });
    return Object.entries(byGrade).map(([name, value]) => ({ name, value, color: GRADE_COLORS[name] ?? '#94a3b8' }));
  })();

  const recentResults = [...results].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()).slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Super Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">University-wide overview of the academic platform.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <>
          {/* University analytics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Building2} label="Departments" value={departments.length} color="primary" />
            <StatCard icon={User} label="Faculty" value={faculty.length} color="accent" />
            <StatCard icon={Users} label="Students" value={students.length} color="success" />
            <StatCard icon={BookOpen} label="Subjects" value={subjects.length} color="warning" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={GraduationCap} label="Academic Records" value={records.length} color="primary" />
            <StatCard icon={TrendingUp} label="College Average" value={`${collegeAvgPct}%`} color={collegeAvgPct >= 50 ? 'success' : 'error'} />
            <StatCard icon={Award} label="College Pass %" value={`${collegePassPct}%`} color="success" />
            <StatCard icon={Award} label="College Fail %" value={`${collegeFailPct}%`} color="error" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pass vs Fail (university level from academic records) */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">College Pass vs Fail</h3>
              <p className="text-sm text-slate-400 mb-4">Aggregated academic records across all departments</p>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label>{pieData.map((d) => <Cell key={d.name} fill={d.color} />)}</Pie><Tooltip /><Legend /></PieChart>
                </ResponsiveContainer>
              ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No academic records yet.</div>}
            </div>

            {/* Department average performance */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Department Performance</h3>
              <p className="text-sm text-slate-400 mb-4">Average percentage by department</p>
              {deptData.length > 0 && deptData.some((d) => d.avg > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                    <Tooltip />
                    <Bar dataKey="avg" name="Avg %" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data yet.</div>}
            </div>

            {/* Department distribution */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Department Distribution</h3>
              <p className="text-sm text-slate-400 mb-4">Students and faculty per department</p>
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                    <Tooltip /><Legend />
                    <Bar dataKey="students" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="faculty" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data yet.</div>}
            </div>

            {/* Grade distribution */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Grade Distribution</h3>
              <p className="text-sm text-slate-400 mb-4">University-wide grade breakdown</p>
              {gradeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={gradeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label>
                      {gradeData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data yet.</div>}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-slate-400" /> Recent Exam Activity</h3>
            {recentResults.length === 0 ? <p className="text-sm text-slate-400 py-8 text-center">No recent activity.</p> : (
              <div className="space-y-2">
                {recentResults.map((r) => {
                  const student = students.find((p) => p.id === r.student_id);
                  const exam = exams.find((e) => e.id === r.exam_id);
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold text-sm shrink-0">{student?.full_name?.charAt(0) ?? '?'}</div>
                        <div><p className="text-sm font-medium text-slate-900 dark:text-white">{student?.full_name ?? 'Unknown'}</p><p className="text-xs text-slate-400">completed {exam?.title ?? 'an exam'}</p></div>
                      </div>
                      <div className="flex items-center gap-3"><span className="text-sm font-bold text-slate-900 dark:text-white">{r.percentage}%</span><span className={`badge ${r.status === 'pass' ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300' : 'bg-error-100 dark:bg-error-700/30 text-error-700 dark:text-error-300'}`}>{r.status}</span></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
