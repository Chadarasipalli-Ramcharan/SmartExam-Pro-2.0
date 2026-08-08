import { useEffect, useState, useMemo } from 'react';
import { GraduationCap, Download, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { SkeletonRow } from '@/components/Loading';
import {
  fetchAcademicRecords, fetchSubjects, fetchFacultyProfiles,
  fetchSemesters, fetchSections, fetchAcademicYears, fetchDepartments,
} from '@/lib/queries';
import type {
  AcademicRecordWithDetails, Subject, Profile, Semester, Section, AcademicYear, Department,
} from '@/types';

const PAGE_SIZE = 10;

export function AcademicRecords() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AcademicRecordWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Profile[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  const [filterDept, setFilterDept] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([
      fetchAcademicRecords(),
      fetchDepartments(),
      fetchSubjects(),
      fetchFacultyProfiles(),
      fetchSemesters(),
      fetchSections(),
      fetchAcademicYears(),
    ]).then(([r, d, s, f, sem, sec, ay]) => {
      setRecords(r);
      setDepartments(d);
      setSubjects(s);
      setFaculty(f);
      setSemesters(sem);
      setSections(sec);
      setAcademicYears(ay);
    }).finally(() => setLoading(false));
  }, []);

  // When department filter changes, narrow semester/section/subject/faculty options
  const deptSemesters = useMemo(
    () => (filterDept ? semesters.filter((s) => s.department_id === filterDept) : semesters),
    [semesters, filterDept],
  );
  const deptSections = useMemo(
    () => (filterDept ? sections.filter((s) => s.department_id === filterDept) : sections),
    [sections, filterDept],
  );
  const deptSubjects = useMemo(
    () => (filterDept ? subjects.filter((s) => s.department_id === filterDept) : subjects),
    [subjects, filterDept],
  );
  const deptFaculty = useMemo(
    () => (filterDept ? faculty.filter((f) => f.department_id === filterDept) : faculty),
    [faculty, filterDept],
  );

  const filtered = useMemo(() => {
    let r = records;
    if (filterDept) r = r.filter((x) => x.department_id === filterDept);
    if (filterSemester) r = r.filter((x) => x.semester_id === filterSemester);
    if (filterSection) r = r.filter((x) => x.section_id === filterSection);
    if (filterSubject) r = r.filter((x) => x.subject_id === filterSubject);
    if (filterFaculty) r = r.filter((x) => x.faculty_id === filterFaculty);
    if (filterYear) r = r.filter((x) => x.academic_year_id === filterYear);
    if (filterStatus) r = r.filter((x) => x.pass_fail === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) =>
        (x.student?.full_name ?? '').toLowerCase().includes(q) ||
        (x.student?.enrollment_number ?? '').toLowerCase().includes(q),
      );
    }
    return r;
  }, [records, filterDept, filterSemester, filterSection, filterSubject, filterFaculty, filterYear, filterStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetPage() { setPage(1); }

  function exportCSV() {
    const headers = ['Department', 'Student', 'Enrollment', 'Semester', 'Section', 'Subject', 'Internal', 'External', 'Assignment', 'Quiz', 'Lab', 'Practical', 'Total', 'Percentage', 'Grade', 'Status', 'Faculty'];
    const rows = filtered.map((r) => [
      r.department?.code ?? '', r.student?.full_name ?? '', r.student?.enrollment_number ?? '',
      r.semester?.name ?? '', r.section?.name ?? '', r.subject?.code ?? '',
      r.internal_marks, r.external_marks, r.assignment_marks, r.quiz_marks, r.lab_marks, r.practical_marks,
      r.total_marks, r.percentage, r.grade, r.pass_fail, r.faculty?.full_name ?? '',
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'university_academic_records.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Academic Records" subtitle="University-wide academic records across all departments" />
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Academic Records"
        subtitle="University-wide academic records across all departments"
        icon={GraduationCap}
        action={
          filtered.length > 0 ? (
            <button onClick={exportCSV} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          ) : undefined
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total Records</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{filtered.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Departments</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {filterDept ? 1 : new Set(records.map((r) => r.department_id)).size}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Pass Rate</p>
          <p className="mt-1 text-2xl font-bold text-success-600 dark:text-success-400">
            {filtered.length > 0 ? Math.round((filtered.filter((r) => r.pass_fail === 'pass').length / filtered.length) * 1000) / 10 : 0}%
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Avg Score</p>
          <p className="mt-1 text-2xl font-bold text-primary-600 dark:text-primary-400">
            {filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.percentage, 0) / filtered.length * 10) / 10 : 0}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              placeholder="Search student or enrollment..."
              className="input pl-10"
            />
          </div>
          <select value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setFilterSemester(''); setFilterSection(''); setFilterSubject(''); setFilterFaculty(''); resetPage(); }} className="input">
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }} className="input">
            <option value="">All Status</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select value={filterSemester} onChange={(e) => { setFilterSemester(e.target.value); resetPage(); }} className="input">
            <option value="">All Semesters</option>
            {deptSemesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterSection} onChange={(e) => { setFilterSection(e.target.value); resetPage(); }} className="input">
            <option value="">All Sections</option>
            {deptSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterSubject} onChange={(e) => { setFilterSubject(e.target.value); resetPage(); }} className="input">
            <option value="">All Subjects</option>
            {deptSubjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
          </select>
          <select value={filterFaculty} onChange={(e) => { setFilterFaculty(e.target.value); resetPage(); }} className="input">
            <option value="">All Faculty</option>
            {deptFaculty.map((f) => <option key={f.id} value={f.id}>{f.full_name}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => { setFilterYear(e.target.value); resetPage(); }} className="input">
            <option value="">All Academic Years</option>
            {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No records found" message="No academic records match your filters, or none have been created yet." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Dept</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Sem</th>
                    <th className="px-4 py-3">Sec</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Int</th>
                    <th className="px-4 py-3">Ext</th>
                    <th className="px-4 py-3">Asgn</th>
                    <th className="px-4 py-3">Quiz</th>
                    <th className="px-4 py-3">Lab</th>
                    <th className="px-4 py-3">Prac</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">%</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Faculty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paged.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">{r.department?.code ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-white">{r.student?.full_name ?? 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{r.student?.enrollment_number ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{r.semester?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{r.section?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.subject?.code ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.internal_marks}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.external_marks}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.assignment_marks}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.quiz_marks}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.lab_marks}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.practical_marks}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.total_marks}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.percentage}%</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${r.grade.startsWith('A') ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' : r.grade === 'F' ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300' : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'}`}>{r.grade}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${r.pass_fail === 'pass' ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' : 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300'}`}>{r.pass_fail}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{r.faculty?.full_name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="btn-secondary px-3 py-2 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="btn-secondary px-3 py-2 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
