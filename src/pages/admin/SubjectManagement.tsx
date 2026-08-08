import { useEffect, useState, useMemo } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonRow } from '@/components/Loading';
import { StatCard } from '@/components/StatCard';
import { supabase } from '@/lib/supabase';
import { fetchDepartments, fetchSemesters, fetchSections, fetchSubjects, fetchFacultyProfiles, fetchAcademicYears } from '@/lib/queries';
import type { SubjectWithDetails, Department, Semester, Section, Profile, AcademicYear } from '@/types';
import { useToast } from '@/context/ToastContext';

interface SubjectRow extends SubjectWithDetails {
  studentCount: number;
  ayName: string | null;
}

export function SubjectManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState<SubjectRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [faculty, setFaculty] = useState<Profile[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SubjectWithDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubjectWithDetails | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [credits, setCredits] = useState(3);
  const [facultyId, setFacultyId] = useState('');
  const [saving, setSaving] = useState(false);
  // filters
  const [fDept, setFDept] = useState('');
  const [fSem, setFSem] = useState('');
  const [fSec, setFSec] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [s, d, sem, sec, f, ay, profilesRes] = await Promise.all([
        fetchSubjects(), fetchDepartments(), fetchSemesters(), fetchSections(), fetchFacultyProfiles(), fetchAcademicYears(),
        supabase.from('profiles').select('id, role, section_id, semester_id'),
      ]);
      const profiles = profilesRes.data as Pick<Profile, 'id' | 'role' | 'section_id' | 'semester_id'>[] | null;
      const ayMap: Record<string, string> = Object.fromEntries(ay.map((y) => [y.id, y.name]));
      const rows: SubjectRow[] = s.map((sub) => {
        const semMatch = sem.find((x) => x.id === sub.semester_id);
        const ayName = semMatch?.academic_year_id ? ayMap[semMatch.academic_year_id] ?? null : null;
        const studentCount = profiles?.filter((p) => p.role === 'student' && p.section_id === sub.section_id && p.semester_id === sub.semester_id).length ?? 0;
        return { ...sub, studentCount, ayName };
      });
      setItems(rows); setDepartments(d); setSemesters(sem); setSections(sec); setFaculty(f); setAcademicYears(ay);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openForm(s: SubjectWithDetails | null) {
    setEditing(s); setCode(s?.code ?? ''); setName(s?.name ?? '');
    setDepartmentId(s?.department_id ?? ''); setSemesterId(s?.semester_id ?? ''); setSectionId(s?.section_id ?? '');
    setCredits(s?.credits ?? 3); setFacultyId(s?.faculty_id ?? '');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !departmentId || !semesterId) { toast('Required fields missing', 'error'); return; }
    setSaving(true);
    const payload = { code: code.trim(), name: name.trim(), department_id: departmentId, semester_id: semesterId, section_id: sectionId || null, credits, faculty_id: facultyId || null };
    const { error } = editing ? await supabase.from('subjects').update(payload).eq('id', editing.id) : await supabase.from('subjects').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast(editing ? 'Subject updated' : 'Subject created', 'success');
    setShowForm(false); load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('subjects').delete().eq('id', deleteTarget.id);
    if (error) { toast('Failed to delete', 'error'); return; }
    toast('Subject deleted', 'success');
    setItems((p) => p.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const deptMap: Record<string, string> = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const semMap: Record<string, string> = Object.fromEntries(semesters.map((s) => [s.id, s.name]));
  const secMap: Record<string, string> = Object.fromEntries(sections.map((s) => [s.id, s.name]));
  const facMap: Record<string, string> = Object.fromEntries(faculty.map((f) => [f.id, f.full_name]));

  const filtered = useMemo(() => items.filter((s) =>
    (!fDept || s.department_id === fDept) &&
    (!fSem || s.semester_id === fSem) &&
    (!fSec || s.section_id === fSec)
  ), [items, fDept, fSem, fSec]);

  const stats = useMemo(() => ({
    total: items.length,
    assigned: items.filter((s) => s.faculty_id).length,
    students: items.reduce((s, x) => s + x.studentCount, 0),
    departments: new Set(items.map((s) => s.department_id)).size,
  }), [items]);

  const columns = [
    { key: 'code', label: 'Code', render: (s: SubjectRow) => <span className="badge bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">{s.code}</span> },
    { key: 'name', label: 'Subject', render: (s: SubjectRow) => <span className="font-medium text-slate-900 dark:text-white">{s.name}</span> },
    { key: 'department_id', label: 'Department', render: (s: SubjectRow) => <span className="text-slate-500 text-sm">{deptMap[s.department_id] ?? '—'}</span> },
    { key: 'ayName', label: 'Academic Year', render: (s: SubjectRow) => <span className="text-slate-500 text-sm">{s.ayName ?? '—'}</span> },
    { key: 'semester_id', label: 'Semester', render: (s: SubjectRow) => <span className="text-slate-500 text-sm">{semMap[s.semester_id] ?? '—'}</span> },
    { key: 'section_id', label: 'Section', render: (s: SubjectRow) => <span className="text-slate-500 text-sm">{s.section_id ? secMap[s.section_id] ?? '—' : '—'}</span> },
    { key: 'credits', label: 'Credits', render: (s: SubjectRow) => <span className="text-slate-500 text-sm">{s.credits}</span> },
    { key: 'faculty_id', label: 'Faculty', render: (s: SubjectRow) => <span className="text-slate-500 text-sm">{s.faculty_id ? facMap[s.faculty_id] ?? 'Unassigned' : 'Unassigned'}</span> },
    { key: 'studentCount', label: 'Students', render: (s: SubjectRow) => <span className="text-slate-500 text-sm">{s.studentCount}</span> },
    { key: 'status', label: 'Status', render: () => <span className="badge bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300">Active</span> },
    { key: 'actions', label: '', render: (s: SubjectRow) => (
      <div className="flex gap-1">
        <button onClick={() => openForm(s)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(s)} className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Subjects" subtitle="Manage university subjects" icon={BookOpen}
        action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> New subject</button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Total Subjects" value={stats.total} color="primary" />
        <StatCard icon={BookOpen} label="Assigned Faculty" value={stats.assigned} color="success" />
        <StatCard icon={BookOpen} label="Total Students" value={stats.students} color="accent" />
        <StatCard icon={BookOpen} label="Departments" value={stats.departments} color="warning" />
      </div>

      {loading ? (
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects yet" action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> Create subject</button>} />
      ) : (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><Filter className="w-4 h-4" /> Filters</div>
            <div><label className="label text-xs">Department</label><select value={fDept} onChange={(e) => { setFDept(e.target.value); setFSem(''); setFSec(''); }} className="input"><option value="">All</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div><label className="label text-xs">Semester</label><select value={fSem} onChange={(e) => setFSem(e.target.value)} className="input" disabled={!fDept}><option value="">All</option>{semesters.filter((s) => !fDept || s.department_id === fDept).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="label text-xs">Section</label><select value={fSec} onChange={(e) => setFSec(e.target.value)} className="input" disabled={!fSem}><option value="">All</option>{sections.filter((s) => !fSem || s.semester_id === fSem).map((s) => <option key={s.id} value={s.id}>Section {s.name}</option>)}</select></div>
            {(fDept || fSem || fSec) && <button onClick={() => { setFDept(''); setFSem(''); setFSec(''); }} className="btn-secondary">Clear</button>}
          </div>
          <DataTable columns={columns} data={filtered} searchKeys={['name', 'code']} pageSize={8} />
        </div>
      )}
      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title={editing ? 'Edit subject' : 'Create subject'} size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Code</label><input type="text" required value={code} onChange={(e) => setCode(e.target.value)} className="input" placeholder="CS101" /></div>
              <div><label className="label">Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Programming in C" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Department</label><select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="input" required><option value="">Select department</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div><label className="label">Semester</label><select value={semesterId} onChange={(e) => setSemesterId(e.target.value)} className="input" required disabled={!departmentId}><option value="">Select semester</option>{semesters.filter((s) => s.department_id === departmentId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Section</label><select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="input" disabled={!semesterId}><option value="">No specific section</option>{sections.filter((s) => s.semester_id === semesterId).map((s) => <option key={s.id} value={s.id}>Section {s.name}</option>)}</select></div>
              <div><label className="label">Credits</label><input type="number" min={1} max={6} value={credits} onChange={(e) => setCredits(Number(e.target.value))} className="input" /></div>
            </div>
            <div><label className="label">Faculty</label><select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} className="input"><option value="">Unassigned</option>{faculty.map((f) => <option key={f.id} value={f.id}>{f.full_name}</option>)}</select></div>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button></div>
          </form>
        </Modal>
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete subject?" message={`"${deleteTarget?.name}" and all related assignments and materials will be deleted.`} confirmText="Delete" danger />
    </div>
  );
}
