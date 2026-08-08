import { useEffect, useState, useMemo } from 'react';
import { Users, UserPlus, Trash2, Pencil, Filter, GraduationCap, CheckCircle2, BookOpen } from 'lucide-react';
import { fetchStudentProfiles, fetchDepartments, fetchAcademicYears, fetchSemesters, fetchSections } from '@/lib/queries';
import type { Profile, Department, AcademicYear, Semester, Section } from '@/types';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonRow } from '@/components/Loading';
import { StatCard } from '@/components/StatCard';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

export function StudentManagement() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [fDept, setFDept] = useState('');
  const [fAY, setFAY] = useState('');
  const [fSem, setFSem] = useState('');
  const [fSec, setFSec] = useState('');
  // edit form state
  const [eDept, setEDept] = useState('');
  const [eAY, setEAY] = useState('');
  const [eSem, setESem] = useState('');
  const [eSec, setESec] = useState('');
  const [eStatus, setEStatus] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, d, ay, sem, sec] = await Promise.all([
        fetchStudentProfiles(), fetchDepartments(), fetchAcademicYears(), fetchSemesters(), fetchSections(),
      ]);
      setStudents(s); setDepartments(d); setAcademicYears(ay); setSemesters(sem); setSections(sec);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('profiles').delete().eq('id', deleteTarget.id);
    if (error) { toast('Failed to delete student', 'error'); return; }
    toast('Student removed', 'success');
    setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  function openEdit(s: Profile) {
    setEditTarget(s); setEDept(s.department_id ?? ''); setEAY(s.academic_year_id ?? '');
    setESem(s.semester_id ?? ''); setESec(s.section_id ?? ''); setEStatus(s.status);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      department_id: eDept || null, academic_year_id: eAY || null,
      semester_id: eSem || null, section_id: eSec || null, status: eStatus,
    }).eq('id', editTarget.id);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Student updated', 'success');
    setEditTarget(null); load();
  }

  async function toggleStatus(s: Profile) {
    const next = !s.status;
    const { error } = await supabase.from('profiles').update({ status: next }).eq('id', s.id);
    if (error) { toast('Failed to update status', 'error'); return; }
    toast(next ? 'Account enabled' : 'Account disabled', 'success');
    setStudents((prev) => prev.map((p) => p.id === s.id ? { ...p, status: next } : p));
  }

  const deptMap: Record<string, string> = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const ayMap: Record<string, string> = Object.fromEntries(academicYears.map((y) => [y.id, y.name]));
  const semMap: Record<string, string> = Object.fromEntries(semesters.map((s) => [s.id, s.name]));
  const secMap: Record<string, string> = Object.fromEntries(sections.map((s) => [s.id, s.name]));

  const filtered = useMemo(() => students.filter((s) =>
    (!fDept || s.department_id === fDept) &&
    (!fAY || s.academic_year_id === fAY) &&
    (!fSem || s.semester_id === fSem) &&
    (!fSec || s.section_id === fSec)
  ), [students, fDept, fAY, fSem, fSec]);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter((s) => s.status).length,
    departments: new Set(students.map((s) => s.department_id).filter(Boolean)).size,
    sections: new Set(students.map((s) => s.section_id).filter(Boolean)).size,
  }), [students]);

  const columns = [
    { key: 'enrollment_number', label: 'Enrollment No.', render: (s: Profile) => <span className="text-slate-500 text-sm font-mono">{s.enrollment_number ?? '—'}</span> },
    { key: 'full_name', label: 'Student', render: (s: Profile) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold text-sm shrink-0">{s.full_name.charAt(0).toUpperCase()}</div>
        <div><p className="font-medium text-slate-900 dark:text-white">{s.full_name}</p><p className="text-xs text-slate-400">{s.email}</p></div>
      </div>
    ) },
    { key: 'email', label: 'Email', render: (s: Profile) => <span className="text-slate-500 hidden md:table-cell">{s.email}</span> },
    { key: 'department_id', label: 'Department', render: (s: Profile) => <span className="text-slate-500 text-sm">{s.department_id ? deptMap[s.department_id] ?? '—' : '—'}</span> },
    { key: 'academic_year_id', label: 'Academic Year', render: (s: Profile) => <span className="text-slate-500 text-sm">{s.academic_year_id ? ayMap[s.academic_year_id] ?? '—' : '—'}</span> },
    { key: 'semester_id', label: 'Semester', render: (s: Profile) => <span className="text-slate-500 text-sm">{s.semester_id ? semMap[s.semester_id] ?? '—' : '—'}</span> },
    { key: 'section_id', label: 'Section', render: (s: Profile) => <span className="text-slate-500 text-sm">{s.section_id ? secMap[s.section_id] ?? '—' : '—'}</span> },
    { key: 'created_at', label: 'Registered', render: (s: Profile) => <span className="text-slate-500 text-xs">{new Date(s.created_at).toLocaleDateString()}</span> },
    { key: 'status', label: 'Status', render: (s: Profile) => <span className={`badge ${s.status ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{s.status ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', label: '', render: (s: Profile) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(s)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Edit"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => toggleStatus(s)} className={`p-2 rounded-lg ${s.status ? 'text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-700/20' : 'text-success-500 hover:bg-success-50 dark:hover:bg-success-700/20'}`} title={s.status ? 'Disable' : 'Enable'}>{s.status ? <Users className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}</button>
        <button onClick={() => setDeleteTarget(s)} className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20" title="Delete"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Management</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage student accounts.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Users className="w-4 h-4" /> {students.length} students</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={stats.total} color="primary" />
        <StatCard icon={CheckCircle2} label="Active" value={stats.active} color="success" />
        <StatCard icon={GraduationCap} label="Departments" value={stats.departments} color="accent" />
        <StatCard icon={BookOpen} label="Sections" value={stats.sections} color="warning" />
      </div>

      {loading ? (
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : students.length === 0 ? (
        <div className="card p-12 text-center">
          <UserPlus className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No students registered yet.</p>
          <p className="text-xs text-slate-400 mt-1">Students appear here after they register.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><Filter className="w-4 h-4" /> Filters</div>
            <div><label className="label text-xs">Department</label><select value={fDept} onChange={(e) => setFDept(e.target.value)} className="input"><option value="">All</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div><label className="label text-xs">Academic Year</label><select value={fAY} onChange={(e) => setFAY(e.target.value)} className="input"><option value="">All</option>{academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select></div>
            <div><label className="label text-xs">Semester</label><select value={fSem} onChange={(e) => setFSem(e.target.value)} className="input"><option value="">All</option>{semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="label text-xs">Section</label><select value={fSec} onChange={(e) => setFSec(e.target.value)} className="input"><option value="">All</option>{sections.map((s) => <option key={s.id} value={s.id}>Section {s.name}</option>)}</select></div>
            {(fDept || fAY || fSem || fSec) && <button onClick={() => { setFDept(''); setFAY(''); setFSem(''); setFSec(''); }} className="btn-secondary">Clear</button>}
          </div>
          <DataTable columns={columns} data={filtered} searchKeys={['full_name', 'email', 'enrollment_number']} pageSize={8} />
        </div>
      )}

      {editTarget && (
        <Modal open onClose={() => setEditTarget(null)} title={`Edit ${editTarget.full_name}`} size="md">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div><label className="label">Department</label><select value={eDept} onChange={(e) => setEDept(e.target.value)} className="input"><option value="">None</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div><label className="label">Academic Year</label><select value={eAY} onChange={(e) => setEAY(e.target.value)} className="input"><option value="">None</option>{academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select></div>
            <div><label className="label">Semester</label><select value={eSem} onChange={(e) => setESem(e.target.value)} className="input" disabled={!eDept}><option value="">None</option>{semesters.filter((s) => !eDept || s.department_id === eDept).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="label">Section</label><select value={eSec} onChange={(e) => setESec(e.target.value)} className="input" disabled={!eSem}><option value="">None</option>{sections.filter((s) => !eSem || s.semester_id === eSem).map((s) => <option key={s.id} value={s.id}>Section {s.name}</option>)}</select></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eStatus} onChange={(e) => setEStatus(e.target.checked)} className="rounded" /> Active</label>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setEditTarget(null)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button></div>
          </form>
        </Modal>
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Remove student?" message={`This will remove ${deleteTarget?.full_name} and all their results. This cannot be undone.`} confirmText="Remove" danger />
    </div>
  );
}
