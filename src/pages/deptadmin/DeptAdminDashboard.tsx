import { useEffect, useState, useMemo } from 'react';
import { Users, BookOpen, User, BarChart3, TrendingUp, Award, ClipboardList, FolderOpen, FileText, GraduationCap } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { SkeletonCard } from '@/components/Loading';
import { fetchStudentProfiles, fetchFacultyProfiles, fetchSubjects, fetchAllResults, fetchAllExams, fetchAcademicRecords, fetchSections, fetchAssignments, fetchMaterials } from '@/lib/queries';
import type { Profile, Subject, Result, Exam, AcademicRecordWithDetails, Section, Assignment, Material } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

const GRADE_COLORS: Record<string, string> = {
  'A+': '#22c55e', A: '#3b82f6', B: '#f59e0b', C: '#a855f7', D: '#ec4899', F: '#ef4444',
};

export function DeptAdminDashboard() {
  const { profile } = useAuth();
  console.log('HOD PROFILE:', profile);
console.log('HOD DEPARTMENT ID:', profile?.department_id);
  const [students, setStudents] = useState<Profile[]>([]);
  const [faculty, setFaculty] = useState<Profile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [records, setRecords] = useState<AcademicRecordWithDetails[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  Promise.all([
    fetchStudentProfiles(),
    fetchFacultyProfiles(),
    fetchSubjects(),
    fetchAllResults(),
    fetchAllExams(),
    fetchSections(),
  ])
    .then(([s, f, sub, r, e, sec]) => {

      console.log('STUDENTS FROM DATABASE:', s);
      console.log('FACULTY FROM DATABASE:', f);
      console.log('SUBJECTS FROM DATABASE:', sub);

      setStudents(s);
      setFaculty(f);
      setSubjects(sub);
      setResults(r);
      setExams(e);
      setSections(sec);
    })
    .finally(() => setLoading(false));
}, []);

  useEffect(() => {
    if (profile?.department_id) {
      fetchAcademicRecords({ departmentId: profile.department_id }).then(setRecords).catch(() => {});
      fetchAssignments().then(setAssignments).catch(() => {});
      fetchMaterials().then(setMaterials).catch(() => {});
    }
  }, [profile]);

  const deptStudents = useMemo(() => students.filter((s) => s.department_id === profile?.department_id), [students, profile]);
  const deptFaculty = useMemo(() => faculty.filter((f) => f.department_id === profile?.department_id), [faculty, profile]);
  const deptSubjects = useMemo(() => subjects.filter((s) => s.department_id === profile?.department_id), [subjects, profile]);
  const deptSections = useMemo(() => sections.filter((s) => s.department_id === profile?.department_id), [sections, profile]);
  const deptAssignments = useMemo(() => assignments.filter((a) => a.subject_id && deptSubjects.some((s) => s.id === a.subject_id)), [assignments, deptSubjects]);
  const deptMaterials = useMemo(() => materials.filter((m) => m.subject_id && deptSubjects.some((s) => s.id === m.subject_id)), [materials, deptSubjects]);

  const deptSubjectIds = useMemo(() => new Set(deptSubjects.map((s) => s.id)), [deptSubjects]);
  const deptExamIds = useMemo(() => new Set(exams.filter((e) => e.subject_id && deptSubjectIds.has(e.subject_id)).map((e) => e.id)), [exams, deptSubjectIds]);
  const deptResults = useMemo(() => results.filter((r) => deptExamIds.has(r.exam_id) || deptStudents.some((s) => s.id === r.student_id)), [results, deptExamIds, deptStudents]);

  const passCount = deptResults.filter((r) => r.status === 'pass').length;
  const failCount = deptResults.length - passCount;
  const avgScore = deptResults.length > 0 ? Math.round(deptResults.reduce((s, r) => s + r.percentage, 0) / deptResults.length * 10) / 10 : 0;
  const passRate = deptResults.length > 0 ? Math.round((passCount / deptResults.length) * 1000) / 10 : 0;
  const failRate = deptResults.length > 0 ? Math.round((failCount / deptResults.length) * 1000) / 10 : 0;

  // Academic records analytics
  const acAvgScore = records.length > 0 ? Math.round(records.reduce((s, r) => s + r.percentage, 0) / records.length * 10) / 10 : 0;
  const acPassCount = records.filter((r) => r.pass_fail === 'pass').length;
  const acFailCount = records.length - acPassCount;
  const acPassRate = records.length > 0 ? Math.round((acPassCount / records.length) * 1000) / 10 : 0;
  const acFailRate = records.length > 0 ? Math.round((acFailCount / records.length) * 1000) / 10 : 0;

  const pieData = [
    { name: 'Pass', value: acPassCount, color: '#22c55e' },
    { name: 'Fail', value: acFailCount, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const subjectData = useMemo(() => {
    return deptSubjects.slice(0, 10).map((s) => {
      const subjectRecords = records.filter((r) => r.subject_id === s.id);
      const avg = subjectRecords.length > 0 ? Math.round(subjectRecords.reduce((sum, r) => sum + r.percentage, 0) / subjectRecords.length) : 0;
      return { name: s.code, avg };
    });
  }, [deptSubjects, records]);

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

  const facultyWorkload = useMemo(() => {
    return deptFaculty.slice(0, 8).map((f) => {
      const facSubjects = deptSubjects.filter((s) => s.faculty_id === f.id);
      const facRecords = records.filter((r) => r.faculty_id === f.id);
      return { name: f.full_name.split(' ')[0], subjects: facSubjects.length, records: facRecords.length };
    });
  }, [deptFaculty, deptSubjects, records]);

  const gradeData = useMemo(() => {
    const byGrade: Record<string, number> = {};
    records.forEach((r) => { byGrade[r.grade] = (byGrade[r.grade] ?? 0) + 1; });
    return Object.entries(byGrade).map(([name, value]) => ({ name, value, color: GRADE_COLORS[name] ?? '#94a3b8' }));
  }, [records]);

  const internalVsExternal = useMemo(() => {
    const intAvg = records.length > 0 ? Math.round(records.reduce((s, r) => s + r.internal_marks, 0) / records.length * 10) / 10 : 0;
    const extAvg = records.length > 0 ? Math.round(records.reduce((s, r) => s + r.external_marks, 0) / records.length * 10) / 10 : 0;
    return [{ name: 'Internal', avg: intAvg }, { name: 'External', avg: extAvg }];
  }, [records]);

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Department Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your department's academic activities.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard
    icon={User}
    label="Faculty"
    value={deptFaculty.length}
    color="accent"
  />

  <StatCard
    icon={Users}
    label="Students"
    value={deptStudents.length}
    color="primary"
  />

  <StatCard
    icon={BookOpen}
    label="Subjects"
    value={deptSubjects.length}
    color="success"
  />

  <StatCard
    icon={Users}
    label="Sections"
    value={deptSections.length}
    color="warning"
  />
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard
    icon={TrendingUp}
    label="Dept Avg Score"
    value={`${acAvgScore}%`}
    color={acAvgScore >= 50 ? 'success' : 'error'}
  />

  <StatCard
    icon={Award}
    label="Pass Rate"
    value={`${acPassRate}%`}
    color="success"
  />

  <StatCard
    icon={Award}
    label="Fail Rate"
    value={`${acFailRate}%`}
    color="error"
  />

  <StatCard
    icon={GraduationCap}
    label="Academic Records"
    value={records.length}
    color="warning"
  />
</div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Pass vs Fail</h3>
              <p className="text-sm text-slate-400 mb-4">Department academic results</p>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label>{pieData.map((d) => <Cell key={d.name} fill={d.color} />)}</Pie><Tooltip /><Legend /></PieChart>
                </ResponsiveContainer>
              ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No results yet.</div>}
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Subject Performance</h3>
              <p className="text-sm text-slate-400 mb-4">Average scores by subject</p>
              {subjectData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={subjectData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Semester Performance</h3>
              <p className="text-sm text-slate-400 mb-4">Average marks by semester</p>
              {semesterData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={semesterData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgb(148 163 184 / 0.6)" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                    <Tooltip />
                    <Line type="monotone" dataKey="avg" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data yet.</div>}
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Faculty Workload</h3>
              <p className="text-sm text-slate-400 mb-4">Subjects and records per faculty</p>
              {facultyWorkload.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={facultyWorkload} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgb(148 163 184 / 0.6)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="subjects" name="Subjects" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="records" name="Records" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data yet.</div>}
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Grade Distribution</h3>
              <p className="text-sm text-slate-400 mb-4">Distribution of grades</p>
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
        </>
      )}
    </div>
  );
}
