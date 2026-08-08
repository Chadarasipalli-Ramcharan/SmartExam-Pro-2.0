import { useEffect, useState, useMemo } from 'react';
import {
  Users, GraduationCap, Building2, BookOpen, Layers, CalendarDays, CalendarRange,
  BarChart3, Vote, CheckCircle2, XCircle, Percent, PieChart as PieChartIcon,
  TrendingUp, UserCog, Award, FileText,
} from 'lucide-react';
import {
  fetchAllProfiles, fetchStudentProfiles, fetchFacultyProfiles,
  fetchDepartments, fetchSubjects, fetchAcademicYears, fetchSemesters, fetchSections,
  fetchPolls, fetchAcademicRecords,
} from '@/lib/queries';
import type { Profile, Department, AcademicYear, Semester, Section, SubjectWithDetails, PollWithDetails, AcademicRecordWithDetails } from '@/types';
import { StatCard } from '@/components/StatCard';
import { SkeletonCard } from '@/components/Loading';
import { PageHeader } from '@/components/PageHeader';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const tooltipStyle = { borderRadius: 12, border: '1px solid rgb(226 232 240)', fontSize: 12 };
const axisStroke = 'rgb(148 163 184 / 0.6)';
const gridStroke = 'rgb(148 163 184 / 0.2)';

interface SectionTitleProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}

function SectionTitle({ icon: Icon, title, subtitle }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  hasData: boolean;
  height?: number;
  children: React.ReactNode;
}

function ChartCard({ title, subtitle, hasData, height = 280, children }: ChartCardProps) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-slate-400 mb-4">{subtitle}</p>}
      {hasData ? (
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">No data yet.</div>
      )}
    </div>
  );
}

export function AnalyticsPage() {
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [faculty, setFaculty] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [polls, setPolls] = useState<PollWithDetails[]>([]);
  const [records, setRecords] = useState<AcademicRecordWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAllProfiles(),
      fetchStudentProfiles(),
      fetchFacultyProfiles(),
      fetchDepartments(),
      fetchSubjects(),
      fetchAcademicYears(),
      fetchSemesters(),
      fetchSections(),
      fetchPolls(),
      fetchAcademicRecords(),
    ])
      .then(([ap, sp, fp, d, s, ay, se, sec, p, ar]) => {
        setAllProfiles(ap);
        setStudents(sp);
        setFaculty(fp);
        setDepartments(d);
        setSubjects(s);
        setAcademicYears(ay);
        setSemesters(se);
        setSections(sec);
        setPolls(p);
        setRecords(ar);
      })
      .finally(() => setLoading(false));
  }, []);

  // ===== Poll analytics =====
  const activePolls = useMemo(() => polls.filter((p) => p.status === 'active'), [polls]);
  const closedPolls = useMemo(() => polls.filter((p) => p.status === 'closed'), [polls]);
  const totalVotes = useMemo(
    () => polls.reduce((sum, p) => sum + (p.total_votes ?? 0), 0),
    [polls]
  );
  // Eligible users = all profiles (students + faculty) who could potentially vote
  const participationRate = allProfiles.length > 0
    ? Math.round((totalVotes / allProfiles.length) * 1000) / 10
    : 0;

  const pollStatusPie = useMemo(() => {
    const data = [
      { name: 'Active', value: activePolls.length },
      { name: 'Closed', value: closedPolls.length },
    ];
    return data.filter((d) => d.value > 0);
  }, [activePolls, closedPolls]);

  const votesPerPoll = useMemo(
    () =>
      polls
        .map((p) => ({
          name: p.title.length > 18 ? p.title.slice(0, 18) + '…' : p.title,
          votes: p.total_votes ?? 0,
        }))
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 10),
    [polls]
  );

  // ===== Student analytics =====
  const registrationGrowth = useMemo(() => {
    const months: Record<string, { key: string; name: string; students: number }> = {};
    students.forEach((s) => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const name = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { key, name, students: 0 };
      months[key].students += 1;
    });
    return Object.values(months).sort((a, b) => a.key.localeCompare(b.key));
  }, [students]);

  const departmentDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => {
      const deptId = s.department_id ?? 'unassigned';
      map[deptId] = (map[deptId] ?? 0) + 1;
    });
    return departments
      .map((d) => ({ name: d.code || d.name, students: map[d.id] ?? 0 }))
      .concat(
        map['unassigned'] ? [{ name: 'Unassigned', students: map['unassigned'] }] : []
      )
      .filter((d) => d.students > 0)
      .sort((a, b) => b.students - a.students);
  }, [students, departments]);

  const semesterDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => {
      const semId = s.semester_id ?? 'unassigned';
      map[semId] = (map[semId] ?? 0) + 1;
    });
    return semesters
      .map((s) => ({ name: s.name, students: map[s.id] ?? 0 }))
      .concat(
        map['unassigned'] ? [{ name: 'Unassigned', students: map['unassigned'] }] : []
      )
      .filter((s) => s.students > 0)
      .sort((a, b) => b.students - a.students);
  }, [students, semesters]);

  // ===== Faculty analytics =====
  const facultyByDepartment = useMemo(() => {
    const map: Record<string, number> = {};
    faculty.forEach((f) => {
      const deptId = f.department_id ?? 'unassigned';
      map[deptId] = (map[deptId] ?? 0) + 1;
    });
    return departments
      .map((d) => ({ name: d.code || d.name, faculty: map[d.id] ?? 0 }))
      .concat(
        map['unassigned'] ? [{ name: 'Unassigned', faculty: map['unassigned'] }] : []
      )
      .filter((d) => d.faculty > 0)
      .sort((a, b) => b.faculty - a.faculty);
  }, [faculty, departments]);

  const subjectAllocation = useMemo(() => {
    const map: Record<string, { id: string; name: string; subjects: number }> = {};
    faculty.forEach((f) => {
      map[f.id] = { id: f.id, name: f.full_name, subjects: 0 };
    });
    subjects.forEach((s) => {
      if (s.faculty_id && map[s.faculty_id]) {
        map[s.faculty_id].subjects += 1;
      }
    });
    return Object.values(map)
      .filter((f) => f.subjects > 0)
      .map((f) => ({
        name: f.name.length > 15 ? f.name.slice(0, 15) + '…' : f.name,
        subjects: f.subjects,
      }))
      .sort((a, b) => b.subjects - a.subjects)
      .slice(0, 12);
  }, [faculty, subjects]);

  // ===== Academic analytics =====
  const overallAvg = records.length > 0 ? Math.round(records.reduce((s, r) => s + r.percentage, 0) / records.length * 10) / 10 : 0;
  const totalPass = records.filter((r) => r.pass_fail === 'pass').length;
  const totalFail = records.length - totalPass;
  const overallPassRate = records.length > 0 ? Math.round((totalPass / records.length) * 1000) / 10 : 0;
  const overallFailRate = records.length > 0 ? Math.round((totalFail / records.length) * 1000) / 10 : 0;

  const deptAvgData = useMemo(() => {
    const byDept: Record<string, { name: string; avg: number; count: number }> = {};
    records.forEach((r) => {
      const dept = departments.find((d) => d.id === r.department_id);
      const name = dept?.code ?? dept?.name ?? 'Unknown';
      if (!byDept[name]) byDept[name] = { name, avg: 0, count: 0 };
      byDept[name].avg += r.percentage;
      byDept[name].count++;
    });
    return Object.values(byDept).map((d) => ({ name: d.name, avg: Math.round(d.avg / d.count * 10) / 10 }));
  }, [records, departments]);

  const semAvgData = useMemo(() => {
    const bySem: Record<string, { name: string; avg: number; count: number }> = {};
    records.forEach((r) => {
      const name = r.semester?.name ?? 'Unknown';
      if (!bySem[name]) bySem[name] = { name, avg: 0, count: 0 };
      bySem[name].avg += r.percentage;
      bySem[name].count++;
    });
    return Object.values(bySem).map((d) => ({ name: d.name, avg: Math.round(d.avg / d.count * 10) / 10 }));
  }, [records]);

  const subjectPassData = useMemo(() => {
    const bySub: Record<string, { name: string; pass: number; total: number }> = {};
    records.forEach((r) => {
      const name = r.subject?.code ?? 'Unknown';
      if (!bySub[name]) bySub[name] = { name, pass: 0, total: 0 };
      bySub[name].total++;
      if (r.pass_fail === 'pass') bySub[name].pass++;
    });
    return Object.values(bySub).map((d) => ({ name: d.name, passRate: Math.round(d.pass / d.total * 100) })).sort((a, b) => a.passRate - b.passRate).slice(0, 10);
  }, [records]);

  const facultyPerfData = useMemo(() => {
    const byFac: Record<string, { name: string; avg: number; count: number }> = {};
    records.forEach((r) => {
      const fac = faculty.find((f) => f.id === r.faculty_id);
      const name = fac?.full_name?.split(' ')[0] ?? 'Unknown';
      if (!byFac[name]) byFac[name] = { name, avg: 0, count: 0 };
      byFac[name].avg += r.percentage;
      byFac[name].count++;
    });
    return Object.values(byFac).map((d) => ({ name: d.name, avg: Math.round(d.avg / d.count * 10) / 10 })).sort((a, b) => b.avg - a.avg).slice(0, 10);
  }, [records, faculty]);

  const topDepts = useMemo(() => [...deptAvgData].sort((a, b) => b.avg - a.avg).slice(0, 5), [deptAvgData]);
  const topFaculty = useMemo(() => [...facultyPerfData].sort((a, b) => b.avg - a.avg).slice(0, 5), [facultyPerfData]);
  const topStudents = useMemo(() => {
    const byStu: Record<string, { name: string; avg: number; count: number }> = {};
    records.forEach((r) => {
      const name = r.student?.full_name ?? 'Unknown';
      if (!byStu[name]) byStu[name] = { name, avg: 0, count: 0 };
      byStu[name].avg += r.percentage;
      byStu[name].count++;
    });
    return Object.values(byStu).map((d) => ({ name: d.name, avg: Math.round(d.avg / d.count * 10) / 10 })).sort((a, b) => b.avg - a.avg).slice(0, 10);
  }, [records]);
  const lowestSubjects = useMemo(() => [...subjectPassData].sort((a, b) => a.passRate - b.passRate).slice(0, 5), [subjectPassData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Analytics" subtitle="University-wide insights and engagement metrics." icon={BarChart3} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Analytics" subtitle="University-wide insights and engagement metrics." icon={BarChart3} />

      {/* ===== University Summary ===== */}
      <section>
        <SectionTitle icon={Building2} title="University Summary" subtitle="Overview of the institutional structure" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Students" value={students.length} color="primary" />
          <StatCard icon={GraduationCap} label="Total Faculty" value={faculty.length} color="accent" />
          <StatCard icon={Building2} label="Departments" value={departments.length} color="success" />
          <StatCard icon={BookOpen} label="Subjects" value={subjects.length} color="warning" />
          <StatCard icon={Layers} label="Sections" value={sections.length} color="primary" />
          <StatCard icon={CalendarDays} label="Academic Years" value={academicYears.length} color="accent" />
          <StatCard icon={CalendarRange} label="Semesters" value={semesters.length} color="success" />
        </div>
      </section>

      {/* ===== Poll Analytics ===== */}
      <section>
        <SectionTitle icon={Vote} title="Poll Analytics" subtitle="Engagement and participation across polls" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Vote} label="Total Polls" value={polls.length} color="primary" />
          <StatCard icon={CheckCircle2} label="Active Polls" value={activePolls.length} color="success" />
          <StatCard icon={XCircle} label="Closed Polls" value={closedPolls.length} color="warning" />
          <StatCard icon={Percent} label="Participation Rate" value={`${participationRate}%`} hint={`${totalVotes} votes / ${allProfiles.length} users`} color="accent" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard title="Active vs Closed Polls" subtitle="Poll status distribution" hasData={pollStatusPie.length > 0}>
            <PieChart>
              <Pie
                data={pollStatusPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                label
              >
                {pollStatusPie.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ChartCard>

          <ChartCard title="Votes per Poll" subtitle="Top polls by total votes" hasData={votesPerPoll.length > 0}>
            <BarChart data={votesPerPoll} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={axisStroke} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} stroke={axisStroke} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="votes" name="Votes" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>
        </div>
      </section>

      {/* ===== Student Analytics ===== */}
      <section>
        <SectionTitle icon={Users} title="Student Analytics" subtitle="Registration trends and distribution" />
        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard title="Registration Growth" subtitle="New students per month" hasData={registrationGrowth.length > 0}>
            <LineChart data={registrationGrowth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={axisStroke} />
              <YAxis tick={{ fontSize: 12 }} stroke={axisStroke} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="students" name="New Students" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Department Distribution" subtitle="Students per department" hasData={departmentDistribution.length > 0}>
            <BarChart data={departmentDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={axisStroke} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} stroke={axisStroke} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="students" name="Students" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Semester Distribution" subtitle="Students per semester" hasData={semesterDistribution.length > 0}>
            <PieChart>
              <Pie
                data={semesterDistribution}
                dataKey="students"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                label
              >
                {semesterDistribution.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ChartCard>
        </div>
      </section>

      {/* ===== Faculty Analytics ===== */}
      <section>
        <SectionTitle icon={UserCog} title="Faculty Analytics" subtitle="Distribution and workload allocation" />
        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard title="Faculty by Department" subtitle="Faculty count per department" hasData={facultyByDepartment.length > 0}>
            <BarChart data={facultyByDepartment} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={axisStroke} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} stroke={axisStroke} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="faculty" name="Faculty" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Subject Allocation" subtitle="Subjects assigned per faculty" hasData={subjectAllocation.length > 0}>
            <BarChart data={subjectAllocation} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={axisStroke} interval={0} angle={-15} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 12 }} stroke={axisStroke} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="subjects" name="Subjects" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>
        </div>
      </section>

      {/* ===== Academic Analytics ===== */}
      <section>
        <SectionTitle icon={TrendingUp} title="Academic Analytics" subtitle="University-wide academic performance" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={FileText} label="Academic Records" value={records.length} color="primary" />
          <StatCard icon={TrendingUp} label="University Average" value={`${overallAvg}%`} color={overallAvg >= 50 ? 'success' : 'error'} />
          <StatCard icon={Award} label="Overall Pass %" value={`${overallPassRate}%`} color="success" />
          <StatCard icon={XCircle} label="Overall Fail %" value={`${overallFailRate}%`} color="error" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard title="Department-wise Average" subtitle="Average marks per department" hasData={deptAvgData.length > 0}>
            <BarChart data={deptAvgData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={axisStroke} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke={axisStroke} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="avg" name="Avg %" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Semester-wise Average" subtitle="Average marks per semester" hasData={semAvgData.length > 0}>
            <LineChart data={semAvgData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={axisStroke} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke={axisStroke} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="avg" name="Avg %" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Subject Pass Rate" subtitle="Lowest performing subjects by pass %" hasData={subjectPassData.length > 0}>
            <BarChart data={subjectPassData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={axisStroke} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke={axisStroke} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="passRate" name="Pass %" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Faculty Performance" subtitle="Top faculty by student average" hasData={facultyPerfData.length > 0}>
            <BarChart data={facultyPerfData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={axisStroke} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke={axisStroke} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="avg" name="Avg %" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>
        </div>
      </section>

      {/* ===== Rankings ===== */}
      <section>
        <SectionTitle icon={Award} title="Rankings" subtitle="Top performers across the university" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Top Departments</h3>
            {topDepts.length > 0 ? (
              <div className="space-y-2">
                {topDepts.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < 3 ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{i + 1}</div>
                    <p className="flex-1 font-medium text-slate-900 dark:text-white">{d.name}</p>
                    <p className="font-bold text-slate-900 dark:text-white">{d.avg}%</p>
                  </div>
                ))}
              </div>
            ) : <div className="py-8 text-center text-slate-400 text-sm">No data yet.</div>}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Top Faculty</h3>
            {topFaculty.length > 0 ? (
              <div className="space-y-2">
                {topFaculty.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < 3 ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{i + 1}</div>
                    <p className="flex-1 font-medium text-slate-900 dark:text-white">{f.name}</p>
                    <p className="font-bold text-slate-900 dark:text-white">{f.avg}%</p>
                  </div>
                ))}
              </div>
            ) : <div className="py-8 text-center text-slate-400 text-sm">No data yet.</div>}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Top Students</h3>
            {topStudents.length > 0 ? (
              <div className="space-y-2">
                {topStudents.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < 3 ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{i + 1}</div>
                    <p className="flex-1 font-medium text-slate-900 dark:text-white">{s.name}</p>
                    <p className="font-bold text-slate-900 dark:text-white">{s.avg}%</p>
                  </div>
                ))}
              </div>
            ) : <div className="py-8 text-center text-slate-400 text-sm">No data yet.</div>}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Lowest Performing Subjects</h3>
            {lowestSubjects.length > 0 ? (
              <div className="space-y-2">
                {lowestSubjects.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300">{i + 1}</div>
                    <p className="flex-1 font-medium text-slate-900 dark:text-white">{s.name}</p>
                    <p className="font-bold text-error-600 dark:text-error-400">{s.passRate}%</p>
                  </div>
                ))}
              </div>
            ) : <div className="py-8 text-center text-slate-400 text-sm">No data yet.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
