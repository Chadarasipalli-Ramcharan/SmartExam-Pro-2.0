import { useEffect, useState, useMemo } from 'react';
import { BookOpen, BookMarked, Building2, Hash, Layers, CalendarDays, Users, GraduationCap, Filter } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { SkeletonCard } from '@/components/Loading';
import { fetchSubjects, fetchAcademicYears, fetchSemesters, fetchSections, fetchStudentProfiles } from '@/lib/queries';
import type { SubjectWithDetails, AcademicYear, Semester, Section, Profile } from '@/types';
import { useAuth } from '@/context/AuthContext';

export function FacultySubjects() {
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterSection, setFilterSection] = useState('');

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      fetchSubjects({ facultyId: profile.id }),
      fetchAcademicYears(), fetchSemesters(), fetchSections(), fetchStudentProfiles(),
    ]).then(([s, ay, sem, sec, stu]) => {
      setSubjects(s); setAcademicYears(ay); setSemesters(sem); setSections(sec); setStudents(stu);
    }).catch(() => setSubjects([])).finally(() => setLoading(false));
  }, [profile]);

  const filteredSubjects = useMemo(() => {
    let s = subjects;
    if (filterAcademicYear) s = s.filter((x) => x.semester?.id && semesters.find((sem) => sem.id === x.semester_id)?.academic_year_id === filterAcademicYear);
    if (filterSemester) s = s.filter((x) => x.semester_id === filterSemester);
    if (filterSection) s = s.filter((x) => x.section_id === filterSection);
    return s;
  }, [subjects, filterAcademicYear, filterSemester, filterSection, semesters]);

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Subjects"
        subtitle="Subjects assigned to you with full academic details"
        icon={BookOpen}
      />

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Academic Year</label>
            <select value={filterAcademicYear} onChange={(e) => setFilterAcademicYear(e.target.value)} className="input">
              <option value="">All Years</option>
              {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Semester</label>
            <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="input">
              <option value="">All Semesters</option>
              {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Section</label>
            <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="input">
              <option value="">All Sections</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects found"
          message="No subjects match your filter criteria, or you haven't been assigned to any subjects yet."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((s) => {
            const subjectStudents = students.filter((stu) => stu.section_id === s.section_id || stu.semester_id === s.semester_id);
            return (
              <div key={s.id} className="card p-5 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <span className="badge bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                    {s.code}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white leading-snug">{s.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{s.department?.name ?? '—'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-xs text-slate-400 block">Credits</span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.credits}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-xs text-slate-400 block">Semester</span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.semester?.name ?? '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-xs text-slate-400 block">Section</span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.section?.name ?? 'All'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-xs text-slate-400 block">Department</span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.department?.code ?? '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-xs text-slate-400 block">Students</span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{subjectStudents.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-xs text-slate-400 block">Role</span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Faculty</span>
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
